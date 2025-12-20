"""
User Centroid model for storing precomputed centroid embeddings.
"""
from sqlalchemy import Column, String, ForeignKey, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid

from shared.database.base import Base, TimestampMixin


class UserCentroid(Base, TimestampMixin):
    """
    User Centroid model storing precomputed centroid embedding for each user.
    
    The centroid is the L2-normalized average of all face embeddings for a user,
    providing a more robust representation for matching.
    """
    __tablename__ = "user_centroids"

    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        primary_key=True, 
        nullable=False
    )
    
    # Centroid embedding - 512-dim normalized average
    centroid = Column(ARRAY(Float), nullable=False)
    
    # Metadata for tracking enrollment quality
    embedding_count = Column(Integer, default=0, nullable=False)
    avg_quality_score = Column(Float, default=0.0, nullable=False)
    
    # Pose coverage tracking - list of captured pose categories
    pose_coverage = Column(ARRAY(String), default=[], nullable=False)
    
    def __repr__(self):
        return f"<UserCentroid(user_id={self.user_id}, count={self.embedding_count})>"
    
    @property
    def has_complete_pose_coverage(self) -> bool:
        """Check if user has at least 3 distinct pose categories."""
        return len(set(self.pose_coverage)) >= 3
    
    @property
    def missing_poses(self) -> list:
        """Return list of pose categories not yet captured."""
        all_poses = {'front', 'left_30', 'right_30', 'up_15', 'down_15'}
        captured = set(self.pose_coverage)
        return list(all_poses - captured)
