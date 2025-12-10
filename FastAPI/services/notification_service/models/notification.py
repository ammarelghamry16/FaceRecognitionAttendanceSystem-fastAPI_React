"""
Notification SQLAlchemy model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from shared.database.base import Base


class Notification(Base):
    """
    Notification model for storing user notifications.
    
    Attributes:
        id: Unique identifier
        user_id: ID of the user this notification belongs to
        type: Notification type (class_started, attendance_confirmed, etc.)
        title: Notification title
        message: Notification message body
        data: Additional JSON data related to the notification
        is_read: Whether the notification has been read
        created_at: When the notification was created
    """
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship to user (optional, depends on User model availability)
    # user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, user_id={self.user_id})>"

    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
