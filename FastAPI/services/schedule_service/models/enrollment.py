from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Enum as SQLEnum, String
from sqlalchemy.orm import relationship
from shared.database.base import BaseModel
from enum import Enum
from datetime import datetime


class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    DROPPED = "dropped"
    COMPLETED = "completed"
    SUSPENDED = "suspended"


class Enrollment(BaseModel):
    """
    Enrollment model represents the relationship between a student and a class.
    This is where we track which students are enrolled in which classes.
    """
    __tablename__ = "enrollments"

    # Student information (will be linked to User model later)
    student_id = Column(Integer, nullable=False, index=True)  # Foreign key to User table
    student_name = Column(String(100), nullable=False)  # Temporary - will be removed when User model is ready
    student_email = Column(String(100), nullable=False, index=True)  # Temporary field

    # Class relationship
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    class_session = relationship("Class", back_populates="enrollments")

    # Enrollment details
    enrollment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE, nullable=False)

    # Academic tracking
    grade = Column(String(5), nullable=True)  # e.g., "A+", "B", "C", etc.
    attendance_percentage = Column(Integer, default=0, nullable=False)  # 0-100
    total_classes_attended = Column(Integer, default=0, nullable=False)
    total_classes_missed = Column(Integer, default=0, nullable=False)

    # Enrollment metadata
    enrollment_method = Column(String(20), default="manual", nullable=False)  # manual, auto, waitlist
    priority = Column(Integer, default=0, nullable=False)  # For waitlist management
    notes = Column(String(500), nullable=True)  # Admin notes about enrollment

    # Timestamps for important events
    dropped_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)

    # Payment/Fee tracking (if needed)
    payment_status = Column(String(20), default="pending", nullable=False)  # pending, paid, overdue
    fee_amount = Column(Integer, default=0, nullable=False)  # Fee in cents (e.g., $100 = 10000)

    def __repr__(self):
        return f"<Enrollment(student_id={self.student_id}, class_id={self.class_id}, status='{self.status}')>"

    @property
    def is_active(self) -> bool:
        """Check if enrollment is currently active"""
        return self.status == EnrollmentStatus.ACTIVE

    @property
    def is_completed(self) -> bool:
        """Check if enrollment is completed"""
        return self.status == EnrollmentStatus.COMPLETED

    @property
    def has_good_attendance(self) -> bool:
        """Check if student has good attendance (>= 75%)"""
        return self.attendance_percentage >= 75

    def update_attendance_stats(self, attended: bool):
        """Update attendance statistics when student attends or misses class"""
        if attended:
            self.total_classes_attended += 1
        else:
            self.total_classes_missed += 1

        # Recalculate attendance percentage
        total_classes = self.total_classes_attended + self.total_classes_missed
        if total_classes > 0:
            self.attendance_percentage = int((self.total_classes_attended / total_classes) * 100)

    def to_dict(self):
        """Convert enrollment to dictionary with additional computed fields"""
        base_dict = super().to_dict()
        base_dict.update({
            'is_active': self.is_active,
            'is_completed': self.is_completed,
            'has_good_attendance': self.has_good_attendance,
            'total_classes': self.total_classes_attended + self.total_classes_missed,
            'fee_amount_dollars': self.fee_amount / 100  # Convert cents to dollars
        })
        return base_dict
