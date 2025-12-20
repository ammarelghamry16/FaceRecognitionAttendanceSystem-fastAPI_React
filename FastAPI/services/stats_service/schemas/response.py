"""
Response schemas for Stats Service.
"""
from pydantic import BaseModel
from typing import Optional


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics response."""
    total_courses: int
    total_classes: int
    total_students: int
    total_mentors: int
    total_admins: int
    active_sessions: int
    overall_attendance_rate: float
    today_sessions: int
    today_attendance_count: int


class StudentStatsResponse(BaseModel):
    """Student attendance statistics response."""
    student_id: str
    total_sessions: int
    present: int
    late: int
    absent: int
    excused: int
    attendance_rate: float


class ClassStatsResponse(BaseModel):
    """Class attendance statistics response."""
    class_id: str
    class_name: str
    total_sessions: int
    total_enrolled: int
    average_attendance_rate: float
