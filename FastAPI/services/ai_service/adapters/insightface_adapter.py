"""
InsightFace adapter for face recognition.
Uses the buffalo_l model for high accuracy.
"""
import numpy as np
from typing import Optional, List, Tuple
import logging

from .base_adapter import IFaceRecognitionAdapter, FaceDetectionResult, RecognitionResult

logger = logging.getLogger(__name__)


class InsightFaceAdapter(IFaceRecognitionAdapter):
    """
    Face recognition adapter using InsightFace library.
    
    InsightFace provides state-of-the-art face recognition with:
    - High accuracy (99%+ on LFW benchmark)
    - Fast inference
    - Good handling of various poses and lighting
    """
    
    _instance = None
    _app = None
    
    def __new__(cls):
        """Singleton pattern - only one model instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize InsightFace model (lazy loading)."""
        if InsightFaceAdapter._app is None:
            self._load_model()
    
    def _load_model(self):
        """Load the InsightFace model."""
        try:
            from insightface.app import FaceAnalysis
            
            logger.info("Loading InsightFace model (buffalo_l)...")
            InsightFaceAdapter._app = FaceAnalysis(
                name="buffalo_l",
                providers=['CPUExecutionProvider']  # Use CPU, add CUDA if available
            )
            InsightFaceAdapter._app.prepare(ctx_id=0, det_size=(640, 640))
            logger.info("InsightFace model loaded successfully")
            
        except ImportError:
            logger.error("InsightFace not installed. Run: pip install insightface onnxruntime")
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
    def app(self):
        """Get the FaceAnalysis app instance."""
        if InsightFaceAdapter._app is None:
            self._load_model()
        return InsightFaceAdapter._app
    
    def detect_faces(self, image: np.ndarray) -> FaceDetectionResult:
        """
        Detect faces and extract embeddings.
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            
        Returns:
            FaceDetectionResult with all detected faces
        """
        if image is None or len(image.shape) != 3:
            return FaceDetectionResult(face_count=0)
        
        # InsightFace expects BGR, convert if RGB
        if image.shape[2] == 3:
            bgr_image = image[:, :, ::-1]  # RGB to BGR
        else:
            bgr_image = image
        
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
