"""
Response schemas for Attendance Service.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime


class AttendanceRecordResponse(BaseModel):
    """Attendance record response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    session_id: UUID
    student_id: UUID
    status: str
    marked_at: Optional[datetime] = None
    confidence_score: Optional[float] = None
    verification_method: str
    is_manual_override: bool
    created_at: datetime


class AttendanceSessionResponse(BaseModel):
    """Attendance session response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    class_id: UUID
    state: str
    start_time: datetime
    end_time: Optional[datetime] = None
    late_threshold_minutes: int
    started_by: Optional[UUID] = None
    ended_by: Optional[UUID] = None
    created_at: datetime


class SessionWithRecordsResponse(AttendanceSessionResponse):
    """Session with attendance records."""
    records: List[AttendanceRecordResponse] = []
    stats: Dict[str, int] = {}


class SessionStatsResponse(BaseModel):
    """Session statistics."""
    session_id: UUID
    total_enrolled: int
    present: int
    absent: int
    late: int
    excused: int
    attendance_rate: float


class AttendanceHistoryResponse(BaseModel):
    """Student attendance history."""
    student_id: UUID
    total_sessions: int
    present_count: int
    absent_count: int
    late_count: int
    attendance_rate: float
    records: List[AttendanceRecordResponse]
