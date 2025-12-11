"""
Request schemas for Attendance Service.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class StartSessionRequest(BaseModel):
    """Request to start an attendance session."""
    class_id: UUID
    late_threshold_minutes: int = Field(default=15, ge=1, le=60)


class MarkAttendanceRequest(BaseModel):
    """Request to mark attendance (from AI service)."""
    session_id: UUID
    student_id: UUID
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    verification_method: str = Field(default="face_recognition")


class ManualAttendanceRequest(BaseModel):
    """Request for manual attendance marking by mentor."""
    session_id: UUID
    student_id: UUID
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    reason: Optional[str] = Field(default=None, max_length=255)


class RecognitionResultRequest(BaseModel):
    """Recognition result from AI service."""
    session_id: UUID
    student_id: UUID
    confidence: float = Field(..., ge=0.0, le=1.0)
    timestamp: Optional[str] = None


class BulkAttendanceRequest(BaseModel):
    """Bulk attendance marking."""
    session_id: UUID
    records: List[ManualAttendanceRequest]
