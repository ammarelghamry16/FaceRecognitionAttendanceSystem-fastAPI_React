"""
Abstract base adapter for face recognition libraries.
Implements Adapter pattern for library interchangeability.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import numpy as np


@dataclass
class FaceDetectionResult:
    """Result of face detection in an image."""
    face_count: int
    face_locations: List[Tuple[int, int, int, int]] = field(default_factory=list)  # (top, right, bottom, left)
    confidence_scores: List[float] = field(default_factory=list)
    embeddings: List[np.ndarray] = field(default_factory=list)


@dataclass
class RecognitionResult:
    """Result of face recognition/matching."""
    matched: bool
    user_id: Optional[str] = None
    confidence: float = 0.0
    distance: float = 1.0
    message: str = ""


class IFaceRecognitionAdapter(ABC):
    """
    Abstract interface for face recognition adapters.
    
    Implementations can use different libraries:
    - InsightFace (recommended)
    - face_recognition (dlib-based)
    - DeepFace
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return adapter name/version."""
        pass
    
    @property
    @abstractmethod
    def embedding_size(self) -> int:
        """Return the size of face embeddings."""
        pass
    
    @abstractmethod
    def detect_faces(self, image: np.ndarray) -> FaceDetectionResult:
        """
        Detect faces in an image.
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            
        Returns:
            FaceDetectionResult with locations and embeddings
        """
        pass
    
    @abstractmethod
    def get_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from image.
        
        Args:
            image: RGB image as numpy array
            
        Returns:
            Normalized embedding vector or None if no face detected
        """
        pass
    
    @abstractmethod
    def compare_embeddings(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> float:
        """
        Compare two embeddings and return distance.
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Distance (lower = more similar), typically 0.0 to 2.0
        """
        pass
    
    def match_face(
        self,
        query_embedding: np.ndarray,
        known_embeddings: List[Tuple[str, np.ndarray]],
        threshold: float = 0.6
    ) -> RecognitionResult:
        """
        Match a face against known embeddings.
        
        Args:
            query_embedding: Embedding to match
            known_embeddings: List of (user_id, embedding) tuples
            threshold: Maximum distance for a match
            
        Returns:
            RecognitionResult with match info
        """
        if not known_embeddings:
            return RecognitionResult(
                matched=False,
                message="No known faces to compare"
            )
        
        best_match = None
        best_distance = float('inf')
        
        for user_id, known_emb in known_embeddings:
            distance = self.compare_embeddings(query_embedding, known_emb)
            if distance < best_distance:
                best_distance = distance
                best_match = user_id
        
        if best_distance <= threshold:
            confidence = 1.0 - (best_distance / threshold)
            return RecognitionResult(
                matched=True,
                user_id=best_match,
                confidence=min(confidence, 1.0),
                distance=best_distance,
                message="Match found"
            )
        
        return RecognitionResult(
            matched=False,
            distance=best_distance,
            message=f"No match (best distance: {best_distance:.3f})"
        )
