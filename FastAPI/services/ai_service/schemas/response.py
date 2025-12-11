"""
Response schemas for AI Service.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class EnrollmentResponse(BaseModel):
    """Face enrollment response."""
    success: bool
    user_id: Optional[UUID] = None
    encodings_count: int = 0
    message: str = ""


class RecognitionResponse(BaseModel):
    """Face recognition response."""
    recognized: bool
    user_id: Optional[UUID] = None
    confidence: float = 0.0
    distance: float = 1.0
    message: str = ""


class FaceEncodingResponse(BaseModel):
    """Face encoding info response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    encoding_version: str
    image_quality_score: Optional[float] = None
    created_at: datetime


class UserEnrollmentStatus(BaseModel):
    """User enrollment status."""
    user_id: UUID
    is_enrolled: bool
    encodings_count: int
