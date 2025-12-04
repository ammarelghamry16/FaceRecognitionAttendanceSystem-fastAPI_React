from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Time, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from datetime import datetime, time
from shared.database.base import BaseModel
class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class ClassStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Class(BaseModel):
    """
    Class model represents a specific class session for a course.
    This is where attendance is tracked.
    """
    __tablename__ = "classes"

    # Basic class information
    name = Column(String(100), nullable=False)  # e.g., "Python Basics - Session 1"
    description = Column(String(500), nullable=True)

    # Course relationship
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    course = relationship("Course", back_populates="classes")

    # Scheduling information
    day_of_week = Column(SQLEnum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)  # e.g., 09:00:00
    end_time = Column(Time, nullable=False)    # e.g., 11:00:00
    duration_minutes = Column(Integer, nullable=False, default=120)  # Duration in minutes

    # Specific session date and time
    scheduled_date = Column(DateTime, nullable=False)  # Specific date for this class
    actual_start_time = Column(DateTime, nullable=True)  # When class actually started
    actual_end_time = Column(DateTime, nullable=True)    # When class actually ended

    # Class details
    room = Column(String(50), nullable=True)      # e.g., "Room 101", "Lab A"
    instructor_id = Column(Integer, nullable=True)  # Will be linked to User model later
    max_students = Column(Integer, default=30, nullable=False)

    # Class status
    status = Column(SQLEnum(ClassStatus), default=ClassStatus.SCHEDULED, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    attendance_required = Column(Boolean, default=True, nullable=False)

    # Attendance tracking
    attendance_window_minutes = Column(Integer, default=15, nullable=False)  # How early students can check in
    late_threshold_minutes = Column(Integer, default=10, nullable=False)     # Minutes after start time considered late

    # Additional information
    notes = Column(String(500), nullable=True)  # Instructor notes
    materials_url = Column(String(200), nullable=True)  # Link to class materials
    recording_url = Column(String(200), nullable=True)   # Link to class recording

    # Relationships
    enrollments = relationship("Enrollment", back_populates="class_session")

    def __repr__(self):
        return f"<Class(name='{self.name}', date='{self.scheduled_date}', status='{self.status}')>"

    @property
    def is_today(self) -> bool:
        """Check if class is scheduled for today"""
        return self.scheduled_date.date() == datetime.now().date()

    @property
    def is_upcoming(self) -> bool:
        """Check if class is in the future"""
        return self.scheduled_date > datetime.now()

    @property
    def is_past(self) -> bool:
        """Check if class is in the past"""
        return self.scheduled_date < datetime.now()

    @property
    def can_start_attendance(self) -> bool:
        """Check if attendance can be started (within attendance window)"""
        now = datetime.now()
        window_start = self.scheduled_date.replace(
            minute=self.scheduled_date.minute - self.attendance_window_minutes
        )
        return window_start <= now <= self.scheduled_date

    def to_dict(self):
        """Convert class to dictionary with additional computed fields"""
        base_dict = super().to_dict()
        base_dict.update({
            'is_today': self.is_today,
            'is_upcoming': self.is_upcoming,
            'is_past': self.is_past,
            'can_start_attendance': self.can_start_attendance,
            'enrolled_students': len(self.enrollments) if self.enrollments else 0
        })
        return base_dict
