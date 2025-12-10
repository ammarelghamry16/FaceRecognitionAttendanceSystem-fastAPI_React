"""
Class model for schedule service.
"""
from sqlalchemy import Column, String, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from shared.database.base import Base, TimestampMixin


class Class(Base, TimestampMixin):
    """
    Class model representing scheduled class sessions.
    """
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    room_number = Column(String(50), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # monday, tuesday, etc.
    schedule_time = Column(Time, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="class_", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Class(id={self.id}, name={self.name}, day={self.day_of_week}, time={self.schedule_time})>"
