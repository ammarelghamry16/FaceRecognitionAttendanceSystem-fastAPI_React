"""
User model - shared across all services.
"""
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID, ENUM
import uuid
from ..database.base import Base, BaseModel
from .enums import UserRole


class User(Base):
    """
    User model representing students, mentors, and admins.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(ENUM(UserRole, name='user_role'), nullable=False, default=UserRole.STUDENT)
    student_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
