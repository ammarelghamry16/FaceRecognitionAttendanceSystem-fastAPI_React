"""
User Centroid Repository for managing centroid embeddings.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from ..models.user_centroid import UserCentroid


class UserCentroidRepository:
    """Repository for UserCentroid data access."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, centroid: UserCentroid) -> UserCentroid:
        """Create a new user centroid."""
        self.db.add(centroid)
        self.db.flush()
        self.db.refresh(centroid)
        return centroid
    
    def find_by_user(self, user_id: UUID) -> Optional[UserCentroid]:
        """Find centroid by user ID."""
        return self.db.query(UserCentroid).filter(
            UserCentroid.user_id == user_id
        ).first()
    
    def update(self, centroid: UserCentroid) -> UserCentroid:
        """Update an existing centroid."""
        self.db.flush()
        self.db.refresh(centroid)
        return centroid
    
    def delete_by_user(self, user_id: UUID) -> bool:
        """Delete centroid for a user."""
        result = self.db.query(UserCentroid).filter(
            UserCentroid.user_id == user_id
        ).delete(synchronize_session=False)
        self.db.flush()
        return result > 0
    
    def get_all(self, skip: int = 0, limit: int = 1000) -> List[UserCentroid]:
        """Get all centroids with pagination."""
        return self.db.query(UserCentroid).offset(skip).limit(limit).all()
    
    def get_all_centroids_for_matching(self) -> List[Tuple[UUID, List[float]]]:
        """
        Get all centroids for matching.
        
        Returns:
            List of (user_id, centroid) tuples
        """
        centroids = self.db.query(UserCentroid).all()
        return [(c.user_id, c.centroid) for c in centroids]
    
    def get_users_needing_recompute(self, min_embeddings: int = 1) -> List[UUID]:
        """
        Get users whose centroids may need recomputation.
        
        Args:
            min_embeddings: Minimum embedding count to consider
            
        Returns:
            List of user IDs
        """
        centroids = self.db.query(UserCentroid).filter(
            UserCentroid.embedding_count >= min_embeddings
        ).all()
        return [c.user_id for c in centroids]
    
    def get_users_with_low_quality(self, threshold: float = 0.7) -> List[UUID]:
        """Get users with average quality below threshold."""
        centroids = self.db.query(UserCentroid).filter(
            UserCentroid.avg_quality_score < threshold
        ).all()
        return [c.user_id for c in centroids]
    
    def get_users_with_incomplete_poses(self, min_poses: int = 3) -> List[UUID]:
        """Get users with fewer than minimum pose categories."""
        # Note: This requires array length check which varies by database
        # For PostgreSQL, we can use array_length
        from sqlalchemy import func
        
        centroids = self.db.query(UserCentroid).filter(
            func.array_length(UserCentroid.pose_coverage, 1) < min_poses
        ).all()
        return [c.user_id for c in centroids]
