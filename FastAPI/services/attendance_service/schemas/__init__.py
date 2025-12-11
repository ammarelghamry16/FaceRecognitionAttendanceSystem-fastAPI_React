"""
Attendance Service Schemas
"""
from .request import (
    StartSessionRequest,
    MarkAttendanceRequest,
    ManualAttendanceRequest,
    RecognitionResultRequest
)
from .response import (
    AttendanceSessionResponse,
    AttendanceRecordResponse,
    SessionStatsResponse,
    AttendanceHistoryResponse
)

__all__ = [
    "StartSessionRequest",
    "MarkAttendanceRequest",
    "ManualAttendanceRequest",
    "RecognitionResultRequest",
    "AttendanceSessionResponse",
    "AttendanceRecordResponse",
    "SessionStatsResponse",
    "AttendanceHistoryResponse"
]
