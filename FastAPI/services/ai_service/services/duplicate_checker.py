"""
Duplicate Checker for preventing redundant face enrollments.
Ensures storage efficiency and optimal matching performance.
"""
from typing import List, Tuple, Optional
from uuid import UUID
import numpy as np
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class DuplicateChecker:
    """
    Checks for duplicate or redundant face enrollments.
    
    Prevents:
    - Near-identical images (same pose, same session)
    - Exceeding maximum enrollment limit per user
    """
    
    # Similarity threshold - embeddings closer than this are considered duplicates
    SIMILARITY_THRESHOLD = 0.15  # Cosine distance
    
    # Maximum enrollments per user
    MAX_ENROLLMENTS = 10
    
    def __init__(self, db: Optional[Session] = None):
        """
        Initialize DuplicateChecker.
        
        Args:
            db: Optional database session for checking existing enrollments
        """
        self.db = db
    
    def is_duplicate(
        self, 
        new_embedding: np.ndarray, 
        existing_embeddings: List[np.ndarray]
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if new embedding is too similar to existing ones.
        
        Args:
            new_embedding: New face embedding to check
            existing_embeddings: List of existing embeddings for the same user
            
        Returns:
            Tuple of (is_duplicate, reason_message)
        """
        if not existing_embeddings:
            return False, None
        
        new_emb = np.array(new_embedding, dtype=np.float32)
        new_emb = new_emb / (np.linalg.norm(new_emb) + 1e-10)
        
        for i, existing in enumerate(existing_embeddings):
            existing_emb = np.array(existing, dtype=np.float32)
            existing_emb = existing_emb / (np.linalg.norm(existing_emb) + 1e-10)
            
            distance = self._cosine_distance(new_emb, existing_emb)
            
            if distance < self.SIMILARITY_THRESHOLD:
                return True, f"Image too similar to existing enrollment (distance: {distance:.3f})"
        
        return False, None
    
    def is_duplicate_from_lists(
        self,
        new_embedding: List[float],
        existing_embeddings: List[List[float]]
    ) -> Tuple[bool, Optional[str]]:
        """
        Check for duplicates using list format (database format).
        
        Args:
            new_embedding: New embedding as float list
            existing_embeddings: Existing embeddings as list of float lists
            
        Returns:
            Tuple of (is_duplicate, reason_message)
        """
        new_np = np.array(new_embedding, dtype=np.float32)
        existing_np = [np.array(e, dtype=np.float32) for e in existing_embeddings]
        return self.is_duplicate(new_np, existing_np)
    
    def can_enroll_more(self, user_id: UUID, current_count: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        """
        Check if user can add more enrollments.
        
        Args:
            user_id: User ID to check
            current_count: Optional current enrollment count (if known)
            
        Returns:
            Tuple of (can_enroll, reason_message)
        """
        count = current_count
        
        # Get count from database if not provided
        if count is None and self.db is not None:
            count = self._get_enrollment_count(user_id)
        
        if count is None:
            # Can't determine, allow enrollment
            return True, None
        
        if count >= self.MAX_ENROLLMENTS:
            return False, f"Maximum enrollments reached ({self.MAX_ENROLLMENTS}). Remove existing enrollments first."
        
        return True, None
    
    def _get_enrollment_count(self, user_id: UUID) -> Optional[int]:
        """Get current enrollment count from database."""
        try:
            from ..repositories.face_encoding_repository import FaceEncodingRepository
            
            repo = FaceEncodingRepository(self.db)
            return repo.count_by_user(user_id)
            
        except Exception as e:
            logger.error(f"Failed to get enrollment count for user {user_id}: {e}")
            return None
    
    def get_existing_embeddings(self, user_id: UUID) -> List[np.ndarray]:
        """Get existing embeddings for a user from database."""
        if self.db is None:
            return []
        
        try:
            from ..repositories.face_encoding_repository import FaceEncodingRepository
            
            repo = FaceEncodingRepository(self.db)
            encodings = repo.find_by_user(user_id)
            
            return [np.array(e.encoding, dtype=np.float32) for e in encodings]
            
        except Exception as e:
            logger.error(f"Failed to get embeddings for user {user_id}: {e}")
            return []
    
    def find_most_similar(
        self,
        new_embedding: np.ndarray,
        existing_embeddings: List[np.ndarray]
    ) -> Tuple[int, float]:
        """
        Find the most similar existing embedding.
        
        Args:
            new_embedding: New embedding to compare
            existing_embeddings: List of existing embeddings
            
        Returns:
            Tuple of (index, distance) of most similar embedding
        """
        if not existing_embeddings:
            return -1, float('inf')
        
        new_emb = np.array(new_embedding, dtype=np.float32)
        new_emb = new_emb / (np.linalg.norm(new_emb) + 1e-10)
        
        best_idx = -1
        best_distance = float('inf')
        
        for i, existing in enumerate(existing_embeddings):
            existing_emb = np.array(existing, dtype=np.float32)
            existing_emb = existing_emb / (np.linalg.norm(existing_emb) + 1e-10)
            
            distance = self._cosine_distance(new_emb, existing_emb)
            
            if distance < best_distance:
                best_distance = distance
                best_idx = i
        
        return best_idx, best_distance
    
    def _cosine_distance(self, e1: np.ndarray, e2: np.ndarray) -> float:
        """Compute cosine distance between two embeddings."""
        return float(1.0 - np.dot(e1, e2))
