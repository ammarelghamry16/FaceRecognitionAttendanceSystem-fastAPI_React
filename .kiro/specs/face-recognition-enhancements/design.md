# Design Document: Face Recognition Enhancements

## Overview

This design document outlines the technical approach for enhancing the Face Recognition AI Service to improve accuracy, robustness, and user experience. The enhancements focus on multi-angle enrollment, quality-aware processing, centroid-based matching, and optional features like adaptive learning and liveness detection.

The design builds upon the existing `RecognitionService`, `InsightFaceAdapter`, and `FaceEncodingRepository` components, extending them with new capabilities while maintaining backward compatibility.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Face Recognition Service                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  EnrollmentFlow  │    │ QualityAnalyzer  │    │  PoseClassifier  │  │
│  │  - Multi-angle   │    │ - Sharpness      │    │  - Yaw/Pitch/Roll│  │
│  │  - Progress      │    │ - Lighting       │    │  - Angle buckets │  │
│  │  - Validation    │    │ - Face size      │    │  - Coverage      │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    RecognitionService (Enhanced)                  │  │
│  │  - enroll_face_with_quality()                                    │  │
│  │  - recognize_with_centroid()                                     │  │
│  │  - get_enrollment_metrics()                                      │  │
│  │  - adaptive_threshold_for_user()                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                   │                                      │
│           ┌───────────────────────┼───────────────────────┐             │
│           ▼                       ▼                       ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ CentroidManager  │    │ DuplicateChecker │    │ AdaptiveLearner  │  │
│  │ - Compute avg    │    │ - Distance check │    │ - Candidate pool │  │
│  │ - Update on add  │    │ - Similarity     │    │ - Auto-enroll    │  │
│  │ - Update on del  │    │ - Limit check    │    │ - Replace old    │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    LivenessDetector (Optional)                    │  │
│  │  - Texture analysis                                               │  │
│  │  - Moiré pattern detection                                        │  │
│  │  - Score computation                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  FaceEncoding    │    │  UserCentroid    │    │ AdaptiveCandidate│  │
│  │  (Extended)      │    │  (New)           │    │  (New)           │  │
│  │  + quality_score │    │  - user_id       │    │  - user_id       │  │
│  │  + pose_category │    │  - centroid      │    │  - embedding     │  │
│  │  + is_adaptive   │    │  - updated_at    │    │  - confidence    │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. QualityAnalyzer

Analyzes face image quality for enrollment decisions.

```python
@dataclass
class QualityMetrics:
    overall_score: float      # 0.0 - 1.0
    sharpness: float          # Laplacian variance
    lighting_uniformity: float # Histogram analysis
    face_size_ratio: float    # Face area / image area
    detection_confidence: float
    rejection_reason: Optional[str] = None

class QualityAnalyzer:
    MIN_QUALITY_SCORE = 0.6
    MIN_FACE_SIZE_RATIO = 0.10
    MIN_DETECTION_CONFIDENCE = 0.7
    
    def analyze(self, image: np.ndarray, face_bbox: tuple) -> QualityMetrics:
        """Compute quality metrics for a face image."""
        pass
    
    def is_acceptable(self, metrics: QualityMetrics) -> bool:
        """Check if image meets quality requirements."""
        pass
```

### 2. PoseClassifier

Classifies face pose into angle categories for enrollment coverage.

```python
class PoseCategory(Enum):
    FRONT = "front"           # yaw: -15° to 15°
    LEFT_30 = "left_30"       # yaw: -45° to -15°
    RIGHT_30 = "right_30"     # yaw: 15° to 45°
    UP_15 = "up_15"           # pitch: 10° to 25°
    DOWN_15 = "down_15"       # pitch: -25° to -10°

@dataclass
class PoseInfo:
    yaw: float    # Left/right rotation
    pitch: float  # Up/down rotation
    roll: float   # Tilt
    category: PoseCategory

class PoseClassifier:
    def classify(self, face_landmarks: np.ndarray) -> PoseInfo:
        """Classify face pose from landmarks."""
        pass
    
    def get_missing_categories(self, captured: List[PoseCategory]) -> List[PoseCategory]:
        """Return pose categories not yet captured."""
        pass
```

### 3. CentroidManager

Manages centroid embeddings for robust matching.

```python
class CentroidManager:
    def compute_centroid(self, embeddings: List[np.ndarray]) -> np.ndarray:
        """Compute L2-normalized average of embeddings."""
        if not embeddings:
            return None
        avg = np.mean(embeddings, axis=0)
        return avg / np.linalg.norm(avg)
    
    def update_for_user(self, user_id: UUID) -> None:
        """Recompute and store centroid for user."""
        pass
    
    def get_centroid(self, user_id: UUID) -> Optional[np.ndarray]:
        """Get stored centroid for user."""
        pass
```

### 4. DuplicateChecker

Prevents redundant enrollments.

```python
class DuplicateChecker:
    SIMILARITY_THRESHOLD = 0.15  # Cosine distance
    MAX_ENROLLMENTS = 10
    
    def is_duplicate(self, new_embedding: np.ndarray, 
                     existing_embeddings: List[np.ndarray]) -> bool:
        """Check if embedding is too similar to existing ones."""
        pass
    
    def can_enroll_more(self, user_id: UUID) -> bool:
        """Check if user can add more enrollments."""
        pass
```

### 5. AdaptiveLearner (Optional)

Handles continuous learning from high-confidence recognitions.

```python
@dataclass
class AdaptiveCandidate:
    user_id: UUID
    embedding: np.ndarray
    confidence: float
    timestamp: datetime

class AdaptiveLearner:
    CONFIDENCE_THRESHOLD = 0.95
    CONSECUTIVE_REQUIRED = 3
    
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self._candidates: Dict[UUID, List[AdaptiveCandidate]] = {}
    
    def record_recognition(self, user_id: UUID, embedding: np.ndarray, 
                          confidence: float) -> Optional[np.ndarray]:
        """Record recognition and return embedding to add if criteria met."""
        pass
    
    def _should_add_embedding(self, user_id: UUID) -> bool:
        """Check if consecutive high-confidence matches warrant new embedding."""
        pass
```

### 6. LivenessDetector (Optional)

Basic anti-spoofing using texture analysis.

```python
class LivenessDetector:
    LIVENESS_THRESHOLD = 0.5
    
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
    
    def check_liveness(self, image: np.ndarray, face_bbox: tuple) -> float:
        """Return liveness score (0.0 = fake, 1.0 = real)."""
        # Uses Local Binary Pattern (LBP) texture analysis
        # Detects moiré patterns from screens/photos
        pass
    
    def is_live(self, score: float) -> bool:
        """Check if liveness score passes threshold."""
        return score >= self.LIVENESS_THRESHOLD
```

### 7. Enhanced RecognitionService

Extended service with new capabilities.

```python
class RecognitionService:
    # Adaptive thresholds
    THRESHOLD_HIGH_QUALITY = 0.35  # 5+ high-quality enrollments
    THRESHOLD_STANDARD = 0.40      # 3-4 enrollments
    THRESHOLD_LOW_ENROLLMENT = 0.45  # < 3 enrollments
    
    def enroll_face_with_quality(
        self,
        user_id: UUID,
        image_bytes: bytes,
        require_pose: Optional[PoseCategory] = None
    ) -> EnrollmentResult:
        """Enroll with quality and duplicate checks."""
        pass
    
    def recognize_with_centroid(self, image_bytes: bytes) -> RecognitionResult:
        """Recognize using both individual and centroid matching."""
        pass
    
    def get_enrollment_metrics(self, user_id: UUID) -> EnrollmentMetrics:
        """Get detailed enrollment quality metrics."""
        pass
    
    def get_adaptive_threshold(self, user_id: UUID) -> float:
        """Get match threshold based on user's enrollment quality."""
        pass
```

## Data Models

### Extended FaceEncoding Model

```python
class FaceEncoding(Base, TimestampMixin):
    __tablename__ = "face_encodings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Existing fields
    encoding = Column(ARRAY(Float), nullable=False)
    encoding_version = Column(String(50), default="insightface_v1")
    
    # New fields
    quality_score = Column(Float, nullable=False, default=0.0)
    pose_category = Column(String(20), nullable=True)  # front, left_30, etc.
    is_adaptive = Column(Boolean, default=False)  # True if from adaptive learning
    
    source_image_path = Column(String(500), nullable=True)
```

### New UserCentroid Model

```python
class UserCentroid(Base, TimestampMixin):
    """Stores precomputed centroid embedding for each user."""
    __tablename__ = "user_centroids"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), 
                     primary_key=True, nullable=False)
    centroid = Column(ARRAY(Float), nullable=False)  # 512-dim normalized average
    embedding_count = Column(Integer, default=0)
    avg_quality_score = Column(Float, default=0.0)
    pose_coverage = Column(ARRAY(String), default=[])  # List of captured poses
```

### New AdaptiveCandidate Model (if adaptive learning enabled)

```python
class AdaptiveCandidate(Base, TimestampMixin):
    """Temporary storage for adaptive learning candidates."""
    __tablename__ = "adaptive_candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    embedding = Column(ARRAY(Float), nullable=False)
    confidence = Column(Float, nullable=False)
    sequence_number = Column(Integer, default=1)  # Track consecutive matches
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Quality Score Bounds
*For any* face image analyzed by QualityAnalyzer, the computed quality_score SHALL be in the range [0.0, 1.0]
**Validates: Requirements 2.1**

### Property 2: Quality Rejection Consistency
*For any* face image with quality_score < 0.6, the enrollment SHALL be rejected with a non-empty rejection_reason
**Validates: Requirements 2.2**

### Property 3: Face Size Rejection
*For any* face image where face_area / image_area < 0.10, the enrollment SHALL be rejected
**Validates: Requirements 2.3**

### Property 4: Multi-Face Rejection
*For any* image with face_count > 1, the enrollment SHALL be rejected
**Validates: Requirements 2.5**

### Property 5: Centroid Computation Correctness
*For any* user with N embeddings (N > 0), the centroid SHALL equal the L2-normalized average of all N embeddings
**Validates: Requirements 3.1, 3.2, 3.5**

### Property 6: Centroid Match Selection
*For any* recognition query against a user with centroid, the final_distance SHALL equal min(centroid_distance, best_individual_distance)
**Validates: Requirements 3.3, 3.4**

### Property 7: Duplicate Detection Threshold
*For any* new embedding with cosine_distance < 0.15 from any existing embedding for the same user, enrollment SHALL be rejected as duplicate
**Validates: Requirements 4.2**

### Property 8: Enrollment Limit
*For any* user with 10 existing enrollments, additional enrollment attempts SHALL be rejected
**Validates: Requirements 4.3**

### Property 9: Adaptive Threshold Selection
*For any* user, the match_threshold SHALL be:
- 0.35 if enrollment_count >= 5 AND avg_quality >= 0.8
- 0.45 if enrollment_count < 3
- 0.40 otherwise
**Validates: Requirements 5.1, 5.2**

### Property 10: Enrollment Completion Criteria
*For any* enrollment session, completion status SHALL be TRUE iff at least 3 distinct pose categories have been captured
**Validates: Requirements 1.3, 1.4**

### Property 11: Adaptive Learning Toggle
*For any* recognition event, embedding modification SHALL occur iff adaptive_learning_enabled == TRUE AND confidence > 0.95
**Validates: Requirements 6.1, 6.5**

### Property 12: Re-enrollment Flag Consistency
*For any* user, re_enrollment_recommended SHALL be TRUE iff avg_quality_score < 0.7 OR missing_pose_count > 2
**Validates: Requirements 7.2, 7.3**

### Property 13: Liveness Toggle
*For any* face detection, liveness_check_performed SHALL equal liveness_detection_enabled
**Validates: Requirements 8.1, 8.5**

### Property 14: Liveness Rejection
*For any* image where liveness_detection_enabled == TRUE AND liveness_score < 0.5, recognition SHALL be rejected
**Validates: Requirements 8.2**

## Error Handling

| Error Condition | Response | HTTP Status |
|-----------------|----------|-------------|
| Image decode failure | `{"error": "Failed to decode image"}` | 400 |
| No face detected | `{"error": "No face detected in image"}` | 400 |
| Multiple faces | `{"error": "Multiple faces detected, use single-face image"}` | 400 |
| Quality too low | `{"error": "Image quality too low", "quality_score": 0.45}` | 400 |
| Face too small | `{"error": "Face too small, move closer to camera"}` | 400 |
| Duplicate image | `{"error": "Image too similar to existing enrollment"}` | 400 |
| Enrollment limit | `{"error": "Maximum 10 enrollments reached"}` | 400 |
| Liveness failed | `{"error": "Liveness check failed, possible spoofing"}` | 403 |
| User not found | `{"error": "User not found"}` | 404 |

## Testing Strategy

### Property-Based Testing

The implementation SHALL use **Hypothesis** (Python property-based testing library) for testing correctness properties.

Each property-based test SHALL:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property: `# **Feature: face-recognition-enhancements, Property {N}: {description}**`
- Generate random but valid inputs using custom strategies

Example test structure:
```python
from hypothesis import given, strategies as st, settings

# **Feature: face-recognition-enhancements, Property 5: Centroid Computation Correctness**
@given(embeddings=st.lists(
    st.lists(st.floats(min_value=-1, max_value=1), min_size=512, max_size=512),
    min_size=1, max_size=10
))
@settings(max_examples=100)
def test_centroid_is_normalized_average(embeddings):
    """Centroid equals L2-normalized average of all embeddings."""
    embeddings_np = [np.array(e, dtype=np.float32) for e in embeddings]
    centroid = centroid_manager.compute_centroid(embeddings_np)
    
    expected_avg = np.mean(embeddings_np, axis=0)
    expected_centroid = expected_avg / np.linalg.norm(expected_avg)
    
    assert np.allclose(centroid, expected_centroid, atol=1e-6)
    assert abs(np.linalg.norm(centroid) - 1.0) < 1e-6  # Unit norm
```

### Unit Tests

Unit tests SHALL cover:
- Edge cases (empty embeddings, single embedding, boundary values)
- Error conditions (invalid inputs, missing data)
- Integration points between components

### Test Data Generators

Custom Hypothesis strategies for:
- Valid face embeddings (512-dim normalized vectors)
- Quality metrics within valid ranges
- Pose categories and coverage combinations
