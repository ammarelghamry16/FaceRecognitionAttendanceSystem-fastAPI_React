"""
User model - shared across all services.
"""
from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    User model representing students, mentors, and admins.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default='student')  # student, mentor, admin
    student_id = Column(String(10), unique=True, nullable=True)  # Format: YYYY/NNNNN
    group = Column(String(50), nullable=True)  # Student group (e.g., "Group A", "CS-101")
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
