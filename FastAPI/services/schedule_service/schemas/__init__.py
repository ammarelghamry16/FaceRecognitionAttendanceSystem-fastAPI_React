"""
Schedule service Pydantic schemas.
"""
from .request import (
    CourseCreate,
    CourseUpdate,
    ClassCreate,
    ClassUpdate,
    EnrollmentCreate
)
from .response import (
    CourseResponse,
    ClassResponse,
    ClassDetailResponse,
    EnrollmentResponse,
    ScheduleResponse
)

__all__ = [
    'CourseCreate',
    'CourseUpdate',
    'ClassCreate',
    'ClassUpdate',
    'EnrollmentCreate',
    'CourseResponse',
    'ClassResponse',
    'ClassDetailResponse',
    'EnrollmentResponse',
    'ScheduleResponse'
]
