"""
Enrollment model for schedule service.
"""
from sqlalchemy import Column, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from shared.database.base import Base


class Enrollment(Base):
    """
    Enrollment model representing student-class relationships.
    """
    __tablename__ = "enrollments"

    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)

    # Composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('student_id', 'class_id'),
    )

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    class_ = relationship("Class", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment(student_id={self.student_id}, class_id={self.class_id})>"
