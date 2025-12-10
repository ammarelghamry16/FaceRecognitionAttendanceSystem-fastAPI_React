"""
Request schemas for schedule service API.
"""
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import time


class CourseCreate(BaseModel):
    """Schema for creating a course"""
    code: str = Field(..., min_length=2, max_length=20, description="Course code")
    name: str = Field(..., min_length=3, max_length=100, description="Course name")
    description: Optional[str] = Field(None, description="Course description")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "CS101",
                "name": "Introduction to Computer Science",
                "description": "Fundamentals of programming and computer science"
            }
        }


class CourseUpdate(BaseModel):
    """Schema for updating a course"""
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Advanced Computer Science",
                "description": "Updated description"
            }
        }


class ClassCreate(BaseModel):
    """Schema for creating a class"""
    course_id: UUID = Field(..., description="Course UUID")
    mentor_id: Optional[UUID] = Field(None, description="Mentor UUID")
    name: str = Field(..., min_length=3, max_length=100, description="Class name")
    room_number: str = Field(..., min_length=1, max_length=50, description="Room number")
    day_of_week: str = Field(..., description="Day of the week (monday, tuesday, etc.)")
    schedule_time: time = Field(..., description="Class time")

    class Config:
        json_schema_extra = {
            "example": {
                "course_id": "123e4567-e89b-12d3-a456-426614174000",
                "mentor_id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "CS101 - Section A",
                "room_number": "A101",
                "day_of_week": "monday",
                "schedule_time": "09:00:00"
            }
        }


class ClassUpdate(BaseModel):
    """Schema for updating a class"""
    course_id: Optional[UUID] = None
    mentor_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    room_number: Optional[str] = Field(None, min_length=1, max_length=50)
    day_of_week: Optional[str] = None
    schedule_time: Optional[time] = None

    class Config:
        json_schema_extra = {
            "example": {
                "room_number": "B202",
                "schedule_time": "10:00:00"
            }
        }


class EnrollmentCreate(BaseModel):
    """Schema for creating an enrollment"""
    student_id: UUID = Field(..., description="Student UUID")
    class_id: UUID = Field(..., description="Class UUID")

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174002",
                "class_id": "123e4567-e89b-12d3-a456-426614174003"
            }
        }
