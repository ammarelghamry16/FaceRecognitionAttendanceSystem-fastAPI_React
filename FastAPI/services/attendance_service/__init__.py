"""
Attendance Service Module

Provides attendance session and record management:
- Session lifecycle (start, end, cancel) with State Machine
- Attendance marking (manual and automatic)
- Attendance history and statistics

Usage:
    from services.attendance_service.api import router as attendance_router
    from services.attendance_service.services import AttendanceService
"""
from .api.routes import router
from .services.attendance_service import AttendanceService
from .models.attendance_session import AttendanceSession
from .models.attendance_record import AttendanceRecord

__all__ = [
    "router",
    "AttendanceService",
    "AttendanceSession",
    "AttendanceRecord"
]
