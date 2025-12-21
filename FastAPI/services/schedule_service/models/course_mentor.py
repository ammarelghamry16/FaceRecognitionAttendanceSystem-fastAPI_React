"""
CourseMentor model for many-to-many relationship between courses and mentors.
"""
from sqlalchemy import Column, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from shared.database.base import Base


class CourseMentor(Base):
    """
    Junction table for Course-Mentor many-to-many relationship.
    - 1 Course can have many Mentors
    - 1 Mentor can teach many Courses
    """
    __tablename__ = "course_mentors"

    course_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("courses.id", ondelete="CASCADE"), 
        primary_key=True
    )
    mentor_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        primary_key=True
    )
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<CourseMentor(course_id={self.course_id}, mentor_id={self.mentor_id})>"
