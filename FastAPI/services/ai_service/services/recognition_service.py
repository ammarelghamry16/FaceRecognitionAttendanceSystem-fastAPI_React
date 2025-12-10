"""
Face Recognition Service - Main business logic for face recognition.
"""
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from dataclasses import dataclass
import numpy as np
from PIL import Image
import io
import logging
from sqlalchemy.orm import Session

from ..repositories.face_encoding_repository import FaceEncodingRepository
from ..models.face_encoding import FaceEncoding
from ..adapters.base_adapter import IFaceRecognitionAdapter, RecognitionResult

logger = logging.getLogger(__name__)


@dataclass
class EnrollmentResult:
    """Result of face enrollment."""
    success: bool
    user_id: Optional[UUID] = None
    encodings_count: int = 0
    message: str = ""


class RecognitionService:
    """
    Face recognition service handling enrollment and matching.
    """
    
    # Recognition thresholds
    MATCH_THRESHOLD = 0.4  # Cosine distance threshold for match
    AMBIGUITY_MARGIN = 0.1  # Minimum gap between best and second-best
    MIN_DETECTION_CONFIDENCE = 0.5  # Minimum face detection confidence
    
    def __init__(self, db: Session, adapter: Optional[IFaceRecognitionAdapter] = None):
        self.db = db
        self.encoding_repo = FaceEncodingRepository(db)
        
        # Lazy load adapter
        self._adapter = adapter
    
    @property
    def adapter(self) -> IFaceRecognitionAdapter:
        """Get face recognition adapter (lazy loading)."""
        if self._adapter is None:
            from ..adapters.insightface_adapter import InsightFaceAdapter
            self._adapter = InsightFaceAdapter()
        return self._adapter
    
    # ==================== Enrollment ====================
    
    def enroll_face(
        self,
        user_id: UUID,
        image_bytes: bytes,
        source_path: Optional[str] = None
    ) -> EnrollmentResult:
        """
        Enroll a single face image for a user.
        
        Args:
            user_id: User to enroll
            image_bytes: Image file bytes
            source_path: Optional source file path
            
        Returns:
            EnrollmentResult with status
        """
        try:
            # Convert bytes to numpy array
            image = self._bytes_to_image(image_bytes)
            if image is None:
                return EnrollmentResult(
                    success=False,
                    message="Failed to decode image"
                )
            
            # Detect face and get embedding
            result = self.adapter.detect_faces(image)
            
            if result.face_count == 0:
                return EnrollmentResult(
                    success=False,
                    message="No face detected in image"
                )
            
            if result.face_count > 1:
                return EnrollmentResult(
                    success=False,
                    message=f"Multiple faces detected ({result.face_count}). Please use single-face image"
                )
            
            # Check detection confidence
            if result.confidence_scores[0] < self.MIN_DETECTION_CONFIDENCE:
                return EnrollmentResult(
                    success=False,
                    message="Face detection confidence too low"
                )
            
            # Store encoding
            encoding = FaceEncoding(
                user_id=user_id,
                encoding=result.embeddings[0].tolist(),
                encoding_version=self.adapter.name,
                image_quality_score=result.confidence_scores[0],
                source_image_path=source_path
            )
            
            self.encoding_repo.create(encoding)
            
            return EnrollmentResult(
                success=True,
                user_id=user_id,
                encodings_count=1,
                message="Face enrolled successfully"
            )
            
        except Exception as e:
            logger.error(f"Enrollment error: {e}")
            return EnrollmentResult(
                success=False,
                message=f"Enrollment failed: {str(e)}"
            )
    
    def enroll_multiple(
        self,
        user_id: UUID,
        images: List[bytes]
    ) -> EnrollmentResult:
        """
        Enroll multiple face images for a user.
        
        Args:
            user_id: User to enroll
            images: List of image bytes
            
        Returns:
            EnrollmentResult with total count
        """
        success_count = 0
        errors = []
        
        for i, img_bytes in enumerate(images):
            result = self.enroll_face(user_id, img_bytes, f"image_{i}")
            if result.success:
                success_count += 1
            else:
                errors.append(f"Image {i}: {result.message}")
        
        if success_count == 0:
            return EnrollmentResult(
                success=False,
                message=f"No faces enrolled. Errors: {'; '.join(errors)}"
            )
        
        return EnrollmentResult(
            success=True,
            user_id=user_id,
            encodings_count=success_count,
            message=f"Enrolled {success_count}/{len(images)} faces"
        )
    
    # ==================== Recognition ====================
    
    def recognize_face(self, image_bytes: bytes) -> RecognitionResult:
        """
        Recognize a face from image bytes.
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            RecognitionResult with match info
        """
        try:
            # Convert to image
            image = self._bytes_to_image(image_bytes)
            if image is None:
                return RecognitionResult(
                    matched=False,
                    message="Failed to decode image"
                )
            
            # Detect face
            result = self.adapter.detect_faces(image)
            
            if result.face_count == 0:
                return RecognitionResult(
                    matched=False,
                    message="No face detected"
                )
            
            # Use first face
            query_embedding = result.embeddings[0]
            
            # Get all known encodings
            known_encodings = self.encoding_repo.get_all_user_encodings()
            
            if not known_encodings:
                return RecognitionResult(
                    matched=False,
                    message="No enrolled faces in database"
                )
            
            # Find best match with ambiguity check
            return self._find_best_match(query_embedding, known_encodings)
            
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return RecognitionResult(
                matched=False,
                message=f"Recognition failed: {str(e)}"
            )
    
    def _find_best_match(
        self,
        query_embedding: np.ndarray,
        known_encodings: List[Tuple[UUID, List[float]]]
    ) -> RecognitionResult:
        """
        Find best match with ambiguity detection.
        """
        # Calculate distances for each user (best distance per user)
        user_distances: Dict[UUID, float] = {}
        
        for user_id, encoding in known_encodings:
            distance = self.adapter.compare_embeddings(
                query_embedding,
                np.array(encoding, dtype=np.float32)
            )
            
            if user_id not in user_distances or distance < user_distances[user_id]:
                user_distances[user_id] = distance
        
        # Sort by distance
        sorted_matches = sorted(user_distances.items(), key=lambda x: x[1])
        
        if not sorted_matches:
            return RecognitionResult(matched=False, message="No matches found")
        
        best_user, best_distance = sorted_matches[0]
        second_distance = sorted_matches[1][1] if len(sorted_matches) > 1 else float('inf')
        
        # Check threshold
        if best_distance > self.MATCH_THRESHOLD:
            return RecognitionResult(
                matched=False,
                distance=best_distance,
                message=f"No match (distance {best_distance:.3f} > threshold {self.MATCH_THRESHOLD})"
            )
        
        # Check ambiguity
        if second_distance - best_distance < self.AMBIGUITY_MARGIN:
            return RecognitionResult(
                matched=False,
                distance=best_distance,
                message=f"Ambiguous match (gap {second_distance - best_distance:.3f} < margin)"
            )
        
        # Calculate confidence (inverse of distance, normalized)
        confidence = max(0.0, min(1.0, 1.0 - (best_distance / self.MATCH_THRESHOLD)))
        
        return RecognitionResult(
            matched=True,
            user_id=str(best_user),
            confidence=confidence,
            distance=best_distance,
            message="Match found"
        )
    
    # ==================== Utilities ====================
    
    def _bytes_to_image(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Convert image bytes to numpy array."""
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return np.array(img)
        except Exception as e:
            logger.error(f"Image decode error: {e}")
            return None
    
    def get_user_encodings_count(self, user_id: UUID) -> int:
        """Get number of encodings for a user."""
        return self.encoding_repo.count_by_user(user_id)
    
    def delete_user_encodings(self, user_id: UUID) -> int:
        """Delete all encodings for a user."""
        return self.encoding_repo.delete_by_user(user_id)
    
    def is_user_enrolled(self, user_id: UUID) -> bool:
        """Check if user has face encodings."""
        return self.encoding_repo.user_has_encodings(user_id)
