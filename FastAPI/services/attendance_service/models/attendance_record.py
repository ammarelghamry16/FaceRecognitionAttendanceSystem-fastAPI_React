"""
Attendance Record model for individual student attendance entries.
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Float, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from shared.database.base import Base, TimestampMixin


class AttendanceRecord(Base, TimestampMixin):
    """
    Attendance Record model representing a student's attendance for a session.
    
    Status values:
    - present: Student was recognized/marked present
    - absent: Student was not detected (default)
    - late: Student arrived after threshold
    - excused: Manually excused by mentor
    """
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Attendance info
    status = Column(String(20), default="absent", nullable=False)  # present, absent, late, excused
    marked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Recognition details
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    verification_method = Column(String(50), default="face_recognition")  # face_recognition, manual, qr_code
    
    # Manual override tracking
    is_manual_override = Column(Boolean, default=False)
    overridden_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    override_reason = Column(String(255), nullable=True)
    
    # Relationships
    session = relationship("AttendanceSession", back_populates="records")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student'),
    )

    def __repr__(self):
        return f"<AttendanceRecord(student={self.student_id}, status={self.status})>"
