"""
Enrollment model for schedule service.
"""
from sqlalchemy import Column, ForeignKey, PrimaryKeyConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from shared.database.base import Base


class Enrollment(Base):
    """
    Enrollment model representing student-class relationships.
    """
    __tablename__ = "enrollments"

    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('student_id', 'class_id'),
    )

    # Relationships
    class_ = relationship("Class", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment(student_id={self.student_id}, class_id={self.class_id})>"
