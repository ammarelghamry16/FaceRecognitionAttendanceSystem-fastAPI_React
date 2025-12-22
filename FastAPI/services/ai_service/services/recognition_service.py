"""
Face Recognition Service - Main business logic for face recognition.
Enhanced with quality analysis, pose classification, centroid matching, and duplicate detection.
"""
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from dataclasses import dataclass, field
import numpy as np
from PIL import Image
import io
import logging
from sqlalchemy.orm import Session

from ..repositories.face_encoding_repository import FaceEncodingRepository
from ..models.face_encoding import FaceEncoding
from ..adapters.base_adapter import IFaceRecognitionAdapter, RecognitionResult
from .quality_analyzer import QualityAnalyzer, QualityMetrics
from .pose_classifier import PoseClassifier, PoseCategory, PoseInfo
from .centroid_manager import CentroidManager
from .duplicate_checker import DuplicateChecker

logger = logging.getLogger(__name__)


@dataclass
class EnrollmentResult:
    """Result of face enrollment."""
    success: bool
    user_id: Optional[UUID] = None
    encodings_count: int = 0
    message: str = ""
    quality_score: float = 0.0
    pose_category: Optional[str] = None


@dataclass
class EnrollmentMetrics:
    """Enrollment quality metrics for a user."""
    user_id: UUID
    encoding_count: int = 0
    avg_quality_score: float = 0.0
    pose_coverage: List[str] = field(default_factory=list)
    needs_re_enrollment: bool = False
    re_enrollment_reason: Optional[str] = None
    last_updated: Optional[str] = None


class RecognitionService:
    """
    Face recognition service handling enrollment and matching.
    Enhanced with quality analysis, pose classification, centroid matching, and duplicate detection.
    """
    
    # Recognition thresholds (adaptive based on enrollment quality)
    THRESHOLD_HIGH_QUALITY = 0.35  # 5+ high-quality enrollments
    THRESHOLD_STANDARD = 0.40      # 3-4 enrollments
    THRESHOLD_LOW_ENROLLMENT = 0.45  # < 3 enrollments
    
    MATCH_THRESHOLD = 0.4  # Default threshold (legacy)
    AMBIGUITY_MARGIN = 0.1  # Minimum gap between best and second-best
    MIN_DETECTION_CONFIDENCE = 0.5  # Minimum face detection confidence
    
    # Quality thresholds for adaptive matching
    HIGH_QUALITY_THRESHOLD = 0.8
    MIN_HIGH_QUALITY_COUNT = 5
    
    def __init__(self, db: Session, adapter: Optional[IFaceRecognitionAdapter] = None):
        self.db = db
        self.encoding_repo = FaceEncodingRepository(db)
        
        # Lazy load adapter
        self._adapter = adapter
        
        # Initialize enhancement components
        self.quality_analyzer = QualityAnalyzer()
        self.pose_classifier = PoseClassifier()
        self.centroid_manager = CentroidManager(db)
        self.duplicate_checker = DuplicateChecker(db)
    
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
        source_path: Optional[str] = None,
        skip_quality_check: bool = False,
        skip_duplicate_check: bool = False
    ) -> EnrollmentResult:
        """
        Enroll a single face image for a user with quality and duplicate checks.
        
        Args:
            user_id: User to enroll
            image_bytes: Image file bytes
            source_path: Optional source file path
            skip_quality_check: Skip quality validation (for testing)
            skip_duplicate_check: Skip duplicate detection (for testing)
            
        Returns:
            EnrollmentResult with status, quality score, and pose category
        """
        logger.info(f"🔍 ENROLL: Starting enrollment for user {user_id}, image_size={len(image_bytes)} bytes")
        
        try:
            # Check enrollment limit
            can_enroll, limit_reason = self.duplicate_checker.can_enroll_more(user_id)
            if not can_enroll:
                logger.warning(f"🔍 ENROLL: Enrollment limit reached - {limit_reason}")
                return EnrollmentResult(
                    success=False,
                    message=limit_reason
                )
            
            # Convert bytes to numpy array
            image = self._bytes_to_image(image_bytes)
            if image is None:
                logger.error("🔍 ENROLL: Failed to decode image")
                return EnrollmentResult(
                    success=False,
                    message="Failed to decode image"
                )
            
            logger.info(f"🔍 ENROLL: Image decoded, shape={image.shape}")
            
            # Detect face and get embedding
            result = self.adapter.detect_faces(image)
            logger.info(f"🔍 ENROLL: Face detection result - face_count={result.face_count}, confidence={result.confidence_scores if result.confidence_scores else 'N/A'}")
            
            if result.face_count == 0:
                logger.warning("🔍 ENROLL: No face detected in image")
                return EnrollmentResult(
                    success=False,
                    message="No face detected in image"
                )
            
            # Get face bounding box for quality analysis
            face_bbox = result.face_locations[0] if result.face_locations else (0, 0, image.shape[1], image.shape[0])
            # Convert from (top, right, bottom, left) to (x, y, w, h)
            top, right, bottom, left = face_bbox
            face_bbox_xywh = (left, top, right - left, bottom - top)
            logger.info(f"🔍 ENROLL: Face bbox (x,y,w,h)={face_bbox_xywh}")
            
            # Analyze quality
            quality_metrics = self.quality_analyzer.analyze(
                image, face_bbox_xywh, result.confidence_scores[0]
            )
            logger.info(f"🔍 ENROLL: Quality metrics - overall={quality_metrics.overall_score:.2f}, sharpness={quality_metrics.sharpness:.2f}, lighting={quality_metrics.lighting_uniformity:.2f}, face_size_ratio={quality_metrics.face_size_ratio:.4f} ({quality_metrics.face_size_ratio*100:.1f}%), confidence={quality_metrics.detection_confidence:.2f}")
            
            # Validate quality (unless skipped)
            if not skip_quality_check:
                is_acceptable, rejection_reason = self.quality_analyzer.is_acceptable(
                    quality_metrics, face_count=result.face_count
                )
                logger.info(f"🔍 ENROLL: Quality check - acceptable={is_acceptable}, reason={rejection_reason}")
                if not is_acceptable:
                    logger.warning(f"🔍 ENROLL: Quality rejected - {rejection_reason}")
                    return EnrollmentResult(
                        success=False,
                        message=rejection_reason,
                        quality_score=quality_metrics.overall_score
                    )
            
            # Get embedding
            embedding = result.embeddings[0]
            logger.info(f"🔍 ENROLL: Embedding extracted, shape={embedding.shape}")
            
            # Check for duplicates (unless skipped)
            if not skip_duplicate_check:
                existing_embeddings = self.duplicate_checker.get_existing_embeddings(user_id)
                is_duplicate, dup_reason = self.duplicate_checker.is_duplicate(embedding, existing_embeddings)
                logger.info(f"🔍 ENROLL: Duplicate check - is_duplicate={is_duplicate}, reason={dup_reason}")
                if is_duplicate:
                    logger.warning(f"🔍 ENROLL: Duplicate detected - {dup_reason}")
                    return EnrollmentResult(
                        success=False,
                        message=dup_reason,
                        quality_score=quality_metrics.overall_score
                    )
            
            # Classify pose
            pose_info = None
            pose_category = None
            try:
                # Try to get pose from InsightFace face object
                faces = self.adapter.app.get(image[:, :, ::-1])  # RGB to BGR
                if faces:
                    pose_info = self.pose_classifier.classify_from_face(faces[0])
                    pose_category = pose_info.category.value if pose_info else None
                    logger.info(f"🔍 ENROLL: Pose classified - category={pose_category}")
            except Exception as e:
                logger.warning(f"🔍 ENROLL: Pose classification failed: {e}")
            
            # Store encoding with enhanced metadata
            encoding = FaceEncoding(
                user_id=user_id,
                encoding=embedding.tolist(),
                encoding_version=self.adapter.name,
                image_quality_score=float(result.confidence_scores[0]),
                quality_score=float(quality_metrics.overall_score),  # Convert np.float64 to Python float
                pose_category=pose_category,
                is_adaptive=False,
                source_image_path=source_path
            )
            
            self.encoding_repo.create(encoding)
            logger.info(f"🔍 ENROLL: Encoding saved to database")
            
            # Update centroid
            self._update_user_centroid(user_id)
            logger.info(f"✅ ENROLL: Success for user {user_id}")
            
            return EnrollmentResult(
                success=True,
                user_id=user_id,
                encodings_count=1,
                message="Face enrolled successfully",
                quality_score=quality_metrics.overall_score,
                pose_category=pose_category
            )
            
        except Exception as e:
            logger.error(f"💥 ENROLL: Error - {e}", exc_info=True)
            return EnrollmentResult(
                success=False,
                message=f"Enrollment failed: {str(e)}"
            )
    
    def _update_user_centroid(self, user_id: UUID) -> None:
        """Update centroid for a user after enrollment changes."""
        try:
            encodings = self.encoding_repo.find_by_user(user_id)
            if not encodings:
                self.centroid_manager.delete_centroid(user_id)
                return
            
            embeddings = [np.array(e.encoding, dtype=np.float32) for e in encodings]
            quality_scores = [e.quality_score for e in encodings]
            pose_categories = [e.pose_category for e in encodings if e.pose_category]
            
            self.centroid_manager.update_for_user(
                user_id=user_id,
                embeddings=embeddings,
                quality_scores=quality_scores,
                pose_categories=pose_categories
            )
        except Exception as e:
            logger.error(f"Failed to update centroid for user {user_id}: {e}")
    
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
        Find best match with ambiguity detection and centroid comparison.
        Uses adaptive thresholds based on enrollment quality.
        """
        # Calculate distances for each user (best distance per user)
        user_distances: Dict[UUID, Tuple[float, bool]] = {}  # user_id -> (distance, centroid_used)
        
        # Group encodings by user
        user_embeddings: Dict[UUID, List[np.ndarray]] = {}
        for user_id, encoding in known_encodings:
            if user_id not in user_embeddings:
                user_embeddings[user_id] = []
            user_embeddings[user_id].append(np.array(encoding, dtype=np.float32))
        
        # For each user, compare against both individual embeddings and centroid
        for user_id, embeddings in user_embeddings.items():
            # Get best individual distance
            best_individual = float('inf')
            for emb in embeddings:
                distance = self.adapter.compare_embeddings(query_embedding, emb)
                if distance < best_individual:
                    best_individual = distance
            
            # Get centroid distance
            centroid = self.centroid_manager.get_centroid(user_id)
            centroid_distance = float('inf')
            if centroid is not None:
                centroid_distance = self.adapter.compare_embeddings(query_embedding, centroid)
            
            # Use minimum of centroid and individual
            if centroid_distance <= best_individual:
                user_distances[user_id] = (centroid_distance, True)
            else:
                user_distances[user_id] = (best_individual, False)
        
        # Sort by distance
        sorted_matches = sorted(user_distances.items(), key=lambda x: x[1][0])
        
        if not sorted_matches:
            return RecognitionResult(matched=False, message="No matches found")
        
        best_user, (best_distance, centroid_used) = sorted_matches[0]
        second_distance = sorted_matches[1][1][0] if len(sorted_matches) > 1 else float('inf')
        
        # Get adaptive threshold for best matching user
        threshold = self.get_adaptive_threshold(best_user)
        
        # Check threshold
        if best_distance > threshold:
            return RecognitionResult(
                matched=False,
                distance=best_distance,
                message=f"No match (distance {best_distance:.3f} > threshold {threshold})"
            )
        
        # Check ambiguity
        if second_distance - best_distance < self.AMBIGUITY_MARGIN:
            return RecognitionResult(
                matched=False,
                distance=best_distance,
                message=f"Ambiguous match (gap {second_distance - best_distance:.3f} < margin)"
            )
        
        # Calculate confidence (inverse of distance, normalized)
        confidence = max(0.0, min(1.0, 1.0 - (best_distance / threshold)))
        
        return RecognitionResult(
            matched=True,
            user_id=str(best_user),
            confidence=confidence,
            distance=best_distance,
            message=f"Match found {'(centroid)' if centroid_used else '(individual)'}"
        )
    
    def get_adaptive_threshold(self, user_id: UUID) -> float:
        """
        Get match threshold based on user's enrollment quality.
        
        Returns:
            0.35 for users with 5+ high-quality enrollments
            0.45 for users with < 3 enrollments
            0.40 for standard cases
        """
        try:
            encodings = self.encoding_repo.find_by_user(user_id)
            
            if not encodings:
                return self.THRESHOLD_LOW_ENROLLMENT
            
            count = len(encodings)
            
            if count < 3:
                return self.THRESHOLD_LOW_ENROLLMENT
            
            # Count high-quality enrollments
            high_quality_count = sum(
                1 for e in encodings 
                if e.quality_score >= self.HIGH_QUALITY_THRESHOLD
            )
            
            if count >= self.MIN_HIGH_QUALITY_COUNT and high_quality_count >= self.MIN_HIGH_QUALITY_COUNT:
                return self.THRESHOLD_HIGH_QUALITY
            
            return self.THRESHOLD_STANDARD
            
        except Exception as e:
            logger.error(f"Error getting adaptive threshold: {e}")
            return self.MATCH_THRESHOLD  # Fallback to default
    
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
        try:
            return self.encoding_repo.count_by_user(user_id)
        except Exception as e:
            logger.error(f"Error getting encoding count: {e}")
            return 0
    
    def delete_user_encodings(self, user_id: UUID) -> int:
        """Delete all encodings for a user."""
        try:
            return self.encoding_repo.delete_by_user(user_id)
        except Exception as e:
            logger.error(f"Error deleting encodings: {e}")
            return 0
    
    def is_user_enrolled(self, user_id: UUID) -> bool:
        """Check if user has face encodings."""
        try:
            return self.encoding_repo.user_has_encodings(user_id)
        except Exception as e:
            logger.error(f"Error checking enrollment: {e}")
            return False
    
    def get_enrollment_metrics(self, user_id: UUID) -> EnrollmentMetrics:
        """
        Get detailed enrollment quality metrics for a user.
        
        Returns:
            EnrollmentMetrics with count, quality, pose coverage, and re-enrollment recommendation
        """
        try:
            encodings = self.encoding_repo.find_by_user(user_id)
            
            if not encodings:
                return EnrollmentMetrics(
                    user_id=user_id,
                    encoding_count=0,
                    needs_re_enrollment=True,
                    re_enrollment_reason="No face encodings found"
                )
            
            # Calculate metrics
            count = len(encodings)
            quality_scores = [e.quality_score for e in encodings]
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
            
            # Get pose coverage
            pose_categories = list(set(e.pose_category for e in encodings if e.pose_category))
            
            # Determine if re-enrollment is needed
            needs_re_enrollment = False
            re_enrollment_reason = None
            
            if avg_quality < 0.7:
                needs_re_enrollment = True
                re_enrollment_reason = f"Average quality too low ({avg_quality:.2f} < 0.7)"
            elif len(pose_categories) < 3:
                needs_re_enrollment = True
                missing = self.pose_classifier.get_missing_categories(
                    [PoseCategory(p) for p in pose_categories if p]
                )
                re_enrollment_reason = f"Incomplete pose coverage (missing: {', '.join(str(p.value) for p in missing[:3])})"
            
            # Get last updated time
            last_updated = None
            if encodings:
                latest = max(encodings, key=lambda e: e.updated_at if e.updated_at else e.created_at)
                last_updated = str(latest.updated_at or latest.created_at)
            
            return EnrollmentMetrics(
                user_id=user_id,
                encoding_count=count,
                avg_quality_score=avg_quality,
                pose_coverage=pose_categories,
                needs_re_enrollment=needs_re_enrollment,
                re_enrollment_reason=re_enrollment_reason,
                last_updated=last_updated
            )
            
        except Exception as e:
            logger.error(f"Error getting enrollment metrics: {e}")
            return EnrollmentMetrics(
                user_id=user_id,
                needs_re_enrollment=True,
                re_enrollment_reason=f"Error: {str(e)}"
            )
