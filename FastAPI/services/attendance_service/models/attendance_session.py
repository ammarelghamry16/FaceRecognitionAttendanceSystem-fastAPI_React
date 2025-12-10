"""
Attendance Session model for tracking class attendance periods.
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from shared.database.base import Base, TimestampMixin


class AttendanceSession(Base, TimestampMixin):
    """
    Attendance Session model representing an active attendance-taking period.
    
    A session is created when a mentor activates a class and ends when
    they deactivate it. All attendance records are linked to a session.
    
    States:
    - active: Session is ongoing, attendance can be marked
    - completed: Session ended normally
    - cancelled: Session was cancelled
    """
    __tablename__ = "attendance_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Session timing
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # State: active, completed, cancelled
    state = Column(String(20), default="active", nullable=False)
    
    # Configuration
    late_threshold_minutes = Column(Integer, default=15)  # Minutes after start to mark as late
    
    # Who started/ended the session
    started_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ended_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AttendanceSession(id={self.id}, class_id={self.class_id}, state={self.state})>"

    def is_active(self) -> bool:
        """Check if session is currently active."""
        return self.state == "active"

    def can_mark_attendance(self) -> bool:
        """Check if attendance can be marked in this session."""
        return self.state == "active"

    def get_duration_minutes(self) -> int:
        """Get session duration in minutes."""
        end = self.end_time or datetime.now(timezone.utc)
        delta = end - self.start_time
        return int(delta.total_seconds() / 60)
