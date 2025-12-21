"""
InsightFace adapter for face recognition.
Uses the buffalo_l model for high accuracy.

Features:
- Thread-safe inference with locking
- Concurrent request limiting via semaphore
- GPU acceleration with automatic CPU fallback
- Singleton pattern for efficient resource usage
"""
import numpy as np
from typing import Optional, List, Tuple
import logging
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os

from .base_adapter import IFaceRecognitionAdapter, FaceDetectionResult, RecognitionResult

logger = logging.getLogger(__name__)


class InsightFaceAdapter(IFaceRecognitionAdapter):
    """
    Face recognition adapter using InsightFace library.
    
    InsightFace provides state-of-the-art face recognition with:
    - High accuracy (99%+ on LFW benchmark)
    - Fast inference
    - Good handling of various poses and lighting
    
    Thread Safety:
    - Uses threading.Lock for model inference
    - Semaphore limits concurrent requests (default: 4)
    - Thread pool for async execution
    
    GPU Support:
    - Automatically detects and uses CUDA if available
    - Falls back to CPU if GPU unavailable or fails
    """
    
    _instance = None
    _app = None
    _lock = threading.Lock()  # Thread-safe model access
    _init_lock = threading.Lock()  # Thread-safe initialization
    _semaphore: Optional[threading.Semaphore] = None
    _async_semaphore: Optional[asyncio.Semaphore] = None
    _thread_pool: Optional[ThreadPoolExecutor] = None
    _execution_provider: str = "CPU"
    
    # Configuration
    MAX_CONCURRENT_REQUESTS = int(os.getenv("AI_MAX_CONCURRENT", "4"))
    PREFER_GPU = os.getenv("AI_PREFER_GPU", "true").lower() == "true"
    
    def __new__(cls):
        """Singleton pattern - only one model instance."""
        with cls._init_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._semaphore = threading.Semaphore(cls.MAX_CONCURRENT_REQUESTS)
                cls._thread_pool = ThreadPoolExecutor(
                    max_workers=cls.MAX_CONCURRENT_REQUESTS,
                    thread_name_prefix="insightface_worker"
                )
            return cls._instance
    
    def __init__(self):
        """Initialize InsightFace model (lazy loading)."""
        with self._init_lock:
            if InsightFaceAdapter._app is None:
                self._load_model()
    
    def _get_execution_providers(self) -> List[str]:
        """
        Determine available execution providers.
        Prefers GPU (CUDA) if available and configured.
        """
        providers = []
        
        if self.PREFER_GPU:
            try:
                import onnxruntime as ort
                available = ort.get_available_providers()
                
                # Check for CUDA
                if 'CUDAExecutionProvider' in available:
                    providers.append('CUDAExecutionProvider')
                    logger.info("CUDA GPU detected and available")
                
                # Check for DirectML (Windows)
                if 'DmlExecutionProvider' in available:
                    providers.append('DmlExecutionProvider')
                    logger.info("DirectML GPU detected and available")
                    
                # Check for CoreML (macOS)
                if 'CoreMLExecutionProvider' in available:
                    providers.append('CoreMLExecutionProvider')
                    logger.info("CoreML detected and available")
                    
            except Exception as e:
                logger.warning(f"Error checking GPU providers: {e}")
        
        # Always add CPU as fallback
        providers.append('CPUExecutionProvider')
        return providers
    
    def _load_model(self):
        """Load the InsightFace model with GPU support."""
        try:
            from insightface.app import FaceAnalysis
            
            providers = self._get_execution_providers()
            logger.info(f"Loading InsightFace model (buffalo_l) with providers: {providers}")
            
            # Try loading with preferred providers
            try:
                InsightFaceAdapter._app = FaceAnalysis(
                    name="buffalo_l",
                    providers=providers
                )
                InsightFaceAdapter._app.prepare(ctx_id=0, det_size=(640, 640))
                
                # Determine which provider is actually being used
                if 'CUDAExecutionProvider' in providers and len(providers) > 1:
                    InsightFaceAdapter._execution_provider = "CUDA"
                elif 'DmlExecutionProvider' in providers:
                    InsightFaceAdapter._execution_provider = "DirectML"
                elif 'CoreMLExecutionProvider' in providers:
                    InsightFaceAdapter._execution_provider = "CoreML"
                else:
                    InsightFaceAdapter._execution_provider = "CPU"
                    
                logger.info(f"InsightFace model loaded successfully using {InsightFaceAdapter._execution_provider}")
                
            except Exception as gpu_error:
                # Fallback to CPU only
                logger.warning(f"GPU initialization failed, falling back to CPU: {gpu_error}")
                InsightFaceAdapter._app = FaceAnalysis(
                    name="buffalo_l",
                    providers=['CPUExecutionProvider']
                )
                InsightFaceAdapter._app.prepare(ctx_id=0, det_size=(640, 640))
                InsightFaceAdapter._execution_provider = "CPU"
                logger.info("InsightFace model loaded successfully using CPU")
            
        except ImportError:
            logger.error("InsightFace not installed. Run: pip install insightface onnxruntime-gpu")
            raise
        except Exception as e:
            logger.error(f"Failed to load InsightFace model: {e}")
            raise
    
    @property
    def name(self) -> str:
        return "insightface_buffalo_l_v1"
    
    @property
    def embedding_size(self) -> int:
        return 512  # buffalo_l produces 512-dim embeddings
    
    @property
    def execution_provider(self) -> str:
        """Get the current execution provider (CPU, CUDA, DirectML, CoreML)."""
        return InsightFaceAdapter._execution_provider
    
    @property
    def app(self):
        """Get the FaceAnalysis app instance."""
        if InsightFaceAdapter._app is None:
            self._load_model()
        return InsightFaceAdapter._app
    
    @classmethod
    def get_async_semaphore(cls) -> asyncio.Semaphore:
        """Get or create async semaphore for request limiting."""
        if cls._async_semaphore is None:
            cls._async_semaphore = asyncio.Semaphore(cls.MAX_CONCURRENT_REQUESTS)
        return cls._async_semaphore
    
    def detect_faces(self, image: np.ndarray) -> FaceDetectionResult:
        """
        Detect faces and extract embeddings (thread-safe).
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            
        Returns:
            FaceDetectionResult with all detected faces
            
        Note:
            Uses semaphore to limit concurrent requests and
            lock to ensure thread-safe model access.
        """
        if image is None or len(image.shape) != 3:
            return FaceDetectionResult(face_count=0)
        
        # Acquire semaphore to limit concurrent requests
        acquired = self._semaphore.acquire(timeout=30.0)
        if not acquired:
            logger.warning("Timeout waiting for inference slot")
            return FaceDetectionResult(face_count=0)
        
        try:
            # InsightFace expects BGR, convert if RGB
            if image.shape[2] == 3:
                bgr_image = image[:, :, ::-1]  # RGB to BGR
            else:
                bgr_image = image
            
            # Thread-safe model inference
            with self._lock:
                faces = self.app.get(bgr_image)
            
            if not faces:
                return FaceDetectionResult(face_count=0)
            
            locations = []
            confidences = []
            embeddings = []
            
            for face in faces:
                # Get bounding box
                bbox = face.bbox.astype(int)
                locations.append((bbox[1], bbox[2], bbox[3], bbox[0]))  # top, right, bottom, left
                
                # Get detection confidence
                confidences.append(float(face.det_score))
                
                # Get normalized embedding
                emb = face.embedding.astype(np.float32)
                emb = emb / np.linalg.norm(emb)  # L2 normalize
                embeddings.append(emb)
            
            return FaceDetectionResult(
                face_count=len(faces),
                face_locations=locations,
                confidence_scores=confidences,
                embeddings=embeddings
            )
        finally:
            self._semaphore.release()
    
    async def detect_faces_async(self, image: np.ndarray) -> FaceDetectionResult:
        """
        Async version of detect_faces for use in FastAPI endpoints.
        
        Uses thread pool to avoid blocking the event loop.
        """
        async with self.get_async_semaphore():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self._thread_pool,
                self._detect_faces_sync,
                image
            )
    
    def _detect_faces_sync(self, image: np.ndarray) -> FaceDetectionResult:
        """Internal sync detection without semaphore (used by async version)."""
        if image is None or len(image.shape) != 3:
            return FaceDetectionResult(face_count=0)
        
        # InsightFace expects BGR, convert if RGB
        if image.shape[2] == 3:
            bgr_image = image[:, :, ::-1]  # RGB to BGR
        else:
            bgr_image = image
        
        # Thread-safe model inference
        with self._lock:
            faces = self.app.get(bgr_image)
        
        if not faces:
            return FaceDetectionResult(face_count=0)
        
        locations = []
        confidences = []
        embeddings = []
        
        for face in faces:
            bbox = face.bbox.astype(int)
            locations.append((bbox[1], bbox[2], bbox[3], bbox[0]))
            confidences.append(float(face.det_score))
            emb = face.embedding.astype(np.float32)
            emb = emb / np.linalg.norm(emb)
            embeddings.append(emb)
        
        return FaceDetectionResult(
            face_count=len(faces),
            face_locations=locations,
            confidence_scores=confidences,
            embeddings=embeddings
        )
    
    def get_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from image (first face only).
        
        Args:
            image: RGB image as numpy array
            
        Returns:
            Normalized 512-dim embedding or None
        """
        result = self.detect_faces(image)
        
        if result.face_count == 0:
            return None
        
        return result.embeddings[0]
    
    def compare_embeddings(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> float:
        """
        Compare embeddings using cosine distance.
        
        Args:
            embedding1: First embedding (512-dim)
            embedding2: Second embedding (512-dim)
            
        Returns:
            Cosine distance (0 = identical, 2 = opposite)
        """
        e1 = np.array(embedding1, dtype=np.float32)
        e2 = np.array(embedding2, dtype=np.float32)
        
        # Normalize if not already
        e1 = e1 / (np.linalg.norm(e1) + 1e-10)
        e2 = e2 / (np.linalg.norm(e2) + 1e-10)
        
        # Cosine distance = 1 - cosine_similarity
        cosine_sim = np.dot(e1, e2)
        return float(1.0 - cosine_sim)
    
    def get_status(self) -> dict:
        """
        Get adapter status information.
        
        Returns:
            Dict with model status, execution provider, and concurrency info
        """
        return {
            "model_loaded": InsightFaceAdapter._app is not None,
            "execution_provider": self._execution_provider,
            "max_concurrent_requests": self.MAX_CONCURRENT_REQUESTS,
            "prefer_gpu": self.PREFER_GPU,
            "embedding_size": self.embedding_size,
            "model_name": self.name
        }
    
    @classmethod
    def shutdown(cls):
        """Clean up resources on shutdown."""
        if cls._thread_pool:
            cls._thread_pool.shutdown(wait=True)
            cls._thread_pool = None
        cls._app = None
        cls._instance = None
        logger.info("InsightFace adapter shutdown complete")
