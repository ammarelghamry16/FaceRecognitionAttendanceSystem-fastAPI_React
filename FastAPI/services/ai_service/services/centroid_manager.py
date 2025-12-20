"""
Centroid Manager for computing and managing user face embedding centroids.
Provides robust matching by averaging multiple embeddings per user.
"""
from typing import List, Optional, Tuple
from uuid import UUID
import numpy as np
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class CentroidManager:
    """
    Manages centroid embeddings for users.
    
    The centroid is the L2-normalized average of all face embeddings for a user,
    providing a more robust representation for matching that handles variations
    in pose, lighting, and expression.
    """
    
    def __init__(self, db: Optional[Session] = None):
        """
        Initialize CentroidManager.
        
        Args:
            db: Optional database session for persistence
        """
        self.db = db
    
    def compute_centroid(self, embeddings: List[np.ndarray]) -> Optional[np.ndarray]:
        """
        Compute L2-normalized centroid from multiple embeddings.
        
        Args:
            embeddings: List of face embeddings (each 512-dim)
            
        Returns:
            Normalized centroid embedding or None if no embeddings
        """
        if not embeddings:
            return None
        
        # Stack embeddings and compute mean
        stacked = np.stack(embeddings, axis=0)
        avg = np.mean(stacked, axis=0)
        
        # L2 normalize
        norm = np.linalg.norm(avg)
        if norm > 0:
            centroid = avg / norm
        else:
            # Fallback: return first embedding if average is zero
            centroid = embeddings[0] / np.linalg.norm(embeddings[0])
        
        return centroid.astype(np.float32)
    
    def compute_centroid_from_lists(self, embeddings: List[List[float]]) -> Optional[List[float]]:
        """
        Compute centroid from list of float lists (database format).
        
        Args:
            embeddings: List of embeddings as float lists
            
        Returns:
            Centroid as float list or None
        """
        if not embeddings:
            return None
        
        np_embeddings = [np.array(e, dtype=np.float32) for e in embeddings]
        centroid = self.compute_centroid(np_embeddings)
        
        return centroid.tolist() if centroid is not None else None
    
    def update_for_user(self, user_id: UUID, embeddings: List[np.ndarray], 
                        quality_scores: List[float] = None,
                        pose_categories: List[str] = None) -> Optional[np.ndarray]:
        """
        Compute and optionally store centroid for a user.
        
        Args:
            user_id: User ID
            embeddings: List of user's face embeddings
            quality_scores: Optional list of quality scores for each embedding
            pose_categories: Optional list of pose categories for each embedding
            
        Returns:
            Computed centroid or None
        """
        if not embeddings:
            logger.warning(f"No embeddings provided for user {user_id}")
            return None
        
        centroid = self.compute_centroid(embeddings)
        
        if centroid is None:
            return None
        
        # Calculate average quality score
        avg_quality = 0.0
        if quality_scores:
            avg_quality = sum(quality_scores) / len(quality_scores)
        
        # Get unique pose categories
        unique_poses = list(set(pose_categories)) if pose_categories else []
        
        # Store in database if session available
        if self.db is not None:
            self._store_centroid(
                user_id=user_id,
                centroid=centroid,
                embedding_count=len(embeddings),
                avg_quality=avg_quality,
                pose_coverage=unique_poses
            )
        
        return centroid
    
    def _store_centroid(self, user_id: UUID, centroid: np.ndarray,
                        embedding_count: int, avg_quality: float,
                        pose_coverage: List[str]) -> None:
        """Store or update centroid in database."""
        try:
            from ..models.user_centroid import UserCentroid
            from ..repositories.user_centroid_repository import UserCentroidRepository
            
            repo = UserCentroidRepository(self.db)
            
            existing = repo.find_by_user(user_id)
            
            if existing:
                # Update existing
                existing.centroid = centroid.tolist()
                existing.embedding_count = embedding_count
                existing.avg_quality_score = avg_quality
                existing.pose_coverage = pose_coverage
                repo.update(existing)
            else:
                # Create new
                user_centroid = UserCentroid(
                    user_id=user_id,
                    centroid=centroid.tolist(),
                    embedding_count=embedding_count,
                    avg_quality_score=avg_quality,
                    pose_coverage=pose_coverage
                )
                repo.create(user_centroid)
                
        except Exception as e:
            logger.error(f"Failed to store centroid for user {user_id}: {e}")
    
    def get_centroid(self, user_id: UUID) -> Optional[np.ndarray]:
        """
        Get stored centroid for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Centroid embedding or None if not found
        """
        if self.db is None:
            return None
        
        try:
            from ..repositories.user_centroid_repository import UserCentroidRepository
            
            repo = UserCentroidRepository(self.db)
            user_centroid = repo.find_by_user(user_id)
            
            if user_centroid and user_centroid.centroid:
                return np.array(user_centroid.centroid, dtype=np.float32)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get centroid for user {user_id}: {e}")
            return None
    
    def delete_centroid(self, user_id: UUID) -> bool:
        """Delete centroid for a user."""
        if self.db is None:
            return False
        
        try:
            from ..repositories.user_centroid_repository import UserCentroidRepository
            
            repo = UserCentroidRepository(self.db)
            return repo.delete_by_user(user_id)
            
        except Exception as e:
            logger.error(f"Failed to delete centroid for user {user_id}: {e}")
            return False
    
    def compare_with_centroid(
        self,
        query_embedding: np.ndarray,
        user_id: UUID,
        individual_embeddings: List[np.ndarray]
    ) -> Tuple[float, bool]:
        """
        Compare query against both centroid and individual embeddings.
        
        Returns the minimum distance and whether centroid was used.
        
        Args:
            query_embedding: Query face embedding
            user_id: User to compare against
            individual_embeddings: User's individual embeddings
            
        Returns:
            Tuple of (best_distance, centroid_used)
        """
        # Get centroid
        centroid = self.get_centroid(user_id)
        
        # Compute centroid distance
        centroid_distance = float('inf')
        if centroid is not None:
            centroid_distance = self._cosine_distance(query_embedding, centroid)
        
        # Compute best individual distance
        best_individual = float('inf')
        for emb in individual_embeddings:
            dist = self._cosine_distance(query_embedding, emb)
            if dist < best_individual:
                best_individual = dist
        
        # Return minimum
        if centroid_distance <= best_individual:
            return centroid_distance, True
        else:
            return best_individual, False
    
    def _cosine_distance(self, e1: np.ndarray, e2: np.ndarray) -> float:
        """Compute cosine distance between two embeddings."""
        e1 = np.array(e1, dtype=np.float32)
        e2 = np.array(e2, dtype=np.float32)
        
        # Normalize
        e1 = e1 / (np.linalg.norm(e1) + 1e-10)
        e2 = e2 / (np.linalg.norm(e2) + 1e-10)
        
        # Cosine distance = 1 - cosine_similarity
        return float(1.0 - np.dot(e1, e2))
