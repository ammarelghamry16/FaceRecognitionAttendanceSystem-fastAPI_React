"""
Face Encoding model for storing student face embeddings.
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, LargeBinary, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime, timezone
import uuid

from shared.database.base import Base, TimestampMixin


class FaceEncoding(Base, TimestampMixin):
    """
    Face Encoding model storing face embeddings for recognition.
    
    Each student can have multiple encodings for better accuracy.
    Encodings are stored as float arrays for efficient comparison.
    """
    __tablename__ = "face_encodings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Encoding data - stored as array of floats
    encoding = Column(ARRAY(Float), nullable=False)
    
    # Metadata
    encoding_version = Column(String(50), default="insightface_v1")  # Track model version
    image_quality_score = Column(Float, nullable=True)  # 0.0 to 1.0
    
    # Source info
    source_image_path = Column(String(500), nullable=True)
    
    def __repr__(self):
        return f"<FaceEncoding(id={self.id}, user_id={self.user_id})>"
