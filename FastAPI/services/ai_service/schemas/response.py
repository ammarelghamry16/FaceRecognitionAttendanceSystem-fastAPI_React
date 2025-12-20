"""
Response schemas for AI Service.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class EnrollmentResponse(BaseModel):
    """Face enrollment response with quality metrics."""
    success: bool
    user_id: Optional[UUID] = None
    encodings_count: int = 0
    message: str = ""
    quality_score: float = 0.0
    pose_category: Optional[str] = None


class RecognitionResponse(BaseModel):
    """Face recognition response."""
    recognized: bool
    user_id: Optional[UUID] = None
    confidence: float = 0.0
    distance: float = 1.0
    message: str = ""
    centroid_used: bool = False
    adaptive_threshold: float = 0.4


class FaceEncodingResponse(BaseModel):
    """Face encoding info response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    encoding_version: str
    image_quality_score: Optional[float] = None
    quality_score: float = 0.0
    pose_category: Optional[str] = None
    is_adaptive: bool = False
    created_at: datetime


class UserEnrollmentStatus(BaseModel):
    """User enrollment status."""
    user_id: UUID
    is_enrolled: bool
    encodings_count: int


class EnrollmentMetricsResponse(BaseModel):
    """Detailed enrollment quality metrics for a user."""
    user_id: UUID
    encoding_count: int = 0
    avg_quality_score: float = 0.0
    pose_coverage: List[str] = []
    needs_re_enrollment: bool = False
    re_enrollment_reason: Optional[str] = None
    last_updated: Optional[str] = None
