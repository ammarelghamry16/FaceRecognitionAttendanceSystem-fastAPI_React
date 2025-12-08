"""
Response schemas for schedule service API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import time, datetime
from shared.models.enums import WeekDay


class CourseResponse(BaseModel):
    """Schema for course response"""
    id: UUID
    code: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    """Schema for class response"""
    id: UUID
    course_id: UUID
    mentor_id: Optional[UUID]
    name: str
    room_number: str
    day_of_week: WeekDay
    schedule_time: time
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClassDetailResponse(BaseModel):
    """Schema for detailed class response with relationships"""
    id: UUID
    course_id: UUID
    course_name: str
    course_code: str
    mentor_id: Optional[UUID]
    mentor_name: Optional[str]
    name: str
    room_number: str
    day_of_week: WeekDay
    schedule_time: time
    enrolled_students_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response"""
    student_id: UUID
    class_id: UUID
    enrolled_at: datetime

    class Config:
        from_attributes = True


class ScheduleResponse(BaseModel):
    """Schema for schedule response (list of classes)"""
    classes: List[ClassDetailResponse]
    total: int

    class Config:
        from_attributes = True
