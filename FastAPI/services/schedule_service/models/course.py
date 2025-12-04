from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from shared.database.base import BaseModel


class Course(BaseModel):
    """
    Course model represents a subject or program (e.g., "Python Programming", "Data Science").
    A course can have multiple class sessions.
    """
    __tablename__ = "courses"

    # Basic course information
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "CS101", "MATH201"
    description = Column(Text, nullable=True)

    # Course details
    credits = Column(Integer, default=3, nullable=False)
    duration_weeks = Column(Integer, default=16, nullable=False)  # Course duration in weeks
    max_students = Column(Integer, default=30, nullable=False)   # Maximum students per course

    # Course status
    is_active = Column(Boolean, default=True, nullable=False)

    # Prerequisites (optional - simple text for now)
    prerequisites = Column(Text, nullable=True)  # e.g., "Basic programming knowledge"

    # Department/Category
    department = Column(String(50), nullable=True)  # e.g., "Computer Science", "Mathematics"
    level = Column(String(20), default="Beginner", nullable=False)  # Beginner, Intermediate, Advanced

    # Relationships
    classes = relationship("Class", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course(code='{self.code}', name='{self.name}')>"

    def to_dict(self):
        """Convert course to dictionary with additional computed fields"""
        base_dict = super().to_dict()
        base_dict.update({
            'total_classes': len(self.classes) if self.classes else 0,
            'active_classes': len([c for c in self.classes if c.is_active]) if self.classes else 0
        })
        return base_dict
