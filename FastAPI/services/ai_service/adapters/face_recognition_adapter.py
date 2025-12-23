"""
Face Recognition adapter using dlib-based face_recognition library.
Lighter alternative to InsightFace for deployments with size constraints.
"""
import numpy as np
from typing import Optional, List, Tuple
import logging
import threading

from .base_adapter import IFaceRecognitionAdapter, FaceDetectionResult, RecognitionResult

logger = logging.getLogger(__name__)


class FaceRecognitionAdapter(IFaceRecognitionAdapter):
    """
    Face recognition adapter using face_recognition library (dlib-based).
    
    Lighter than InsightFace but still accurate for most use cases.
    Uses HOG model by default (faster) or CNN model (more accurate).
    """
    
    _instance = None
    _lock = threading.Lock()
    _init_lock = threading.Lock()
    _model = "hog"  # "hog" for speed, "cnn" for accuracy
    
    def __new__(cls):
        """Singleton pattern."""
        with cls._init_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance
    
    def __init__(self):
        """Initialize face_recognition library."""
        pass  # Lazy loading
    
    @property
    def name(self) -> str:
        return f"face_recognition_dlib_{self._model}"
    
    @property
    def embedding_size(self) -> int:
        return 128  # dlib produces 128-dim embeddings
    
    def detect_faces(self, image: np.ndarray) -> FaceDetectionResult:
        """
        Detect faces and extract embeddings.
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            
        Returns:
            FaceDetectionResult with all detected faces
        """
        try:
            import face_recognition
        except ImportError:
            logger.error("face_recognition not installed. Run: pip install face_recognition")
            return FaceDetectionResult(face_count=0)
        
        if image is None or len(image.shape) != 3:
            return FaceDetectionResult(face_count=0)
        
        with self._lock:
            # Detect face locations
            face_locations = face_recognition.face_locations(image, model=self._model)
            
            if not face_locations:
                return FaceDetectionResult(face_count=0)
            
            # Get embeddings for detected faces
            embeddings = face_recognition.face_encodings(image, face_locations)
            
            # Convert to our format
            locations = []
            confidence_scores = []
            embedding_list = []
            
            for loc, emb in zip(face_locations, embeddings):
                locations.append(loc)  # Already in (top, right, bottom, left) format
                confidence_scores.append(1.0)  # face_recognition doesn't provide confidence
                
                # Normalize embedding
                emb = np.array(emb, dtype=np.float32)
                emb = emb / (np.linalg.norm(emb) + 1e-10)
                embedding_list.append(emb)
            
            return FaceDetectionResult(
                face_count=len(face_locations),
                face_locations=locations,
                confidence_scores=confidence_scores,
                embeddings=embedding_list
            )
    
    def get_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from image (first face only).
        
        Args:
            image: RGB image as numpy array
            
        Returns:
            Normalized 128-dim embedding or None
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
        Compare embeddings using Euclidean distance.
        
        Args:
            embedding1: First embedding (128-dim)
            embedding2: Second embedding (128-dim)
            
        Returns:
            Euclidean distance (0 = identical)
        """
        try:
            import face_recognition
            
            e1 = np.array(embedding1, dtype=np.float64)
            e2 = np.array(embedding2, dtype=np.float64)
            
            # Use face_recognition's built-in comparison
            distance = face_recognition.face_distance([e1], e2)[0]
            return float(distance)
        except ImportError:
            # Fallback to manual calculation
            e1 = np.array(embedding1, dtype=np.float32)
            e2 = np.array(embedding2, dtype=np.float32)
            return float(np.linalg.norm(e1 - e2))
    
    def get_status(self) -> dict:
        """Get adapter status information."""
        try:
            import face_recognition
            available = True
        except ImportError:
            available = False
        
        return {
            "model_loaded": available,
            "model": self._model,
            "embedding_size": self.embedding_size,
            "model_name": self.name
        }
