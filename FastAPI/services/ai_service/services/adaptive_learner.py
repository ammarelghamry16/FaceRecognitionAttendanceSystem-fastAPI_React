"""
Adaptive Learner for continuous learning from high-confidence recognitions.
Optional feature that can be enabled/disabled via configuration.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone
import numpy as np
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


@dataclass
class AdaptiveCandidate:
    """Candidate embedding for adaptive learning."""
    user_id: UUID
    embedding: np.ndarray
    confidence: float
    timestamp: datetime


class AdaptiveLearner:
    """
    Handles continuous learning from high-confidence recognitions.
    
    When enabled, tracks high-confidence matches and optionally adds
    new embeddings to improve recognition over time (like iPhone Face ID).
    """
    
    CONFIDENCE_THRESHOLD = 0.95
    CONSECUTIVE_REQUIRED = 3
    
    def __init__(self, db: Optional[Session] = None, enabled: bool = False):
        """
        Initialize AdaptiveLearner.
        
        Args:
            db: Database session for persistence
            enabled: Whether adaptive learning is enabled
        """
        self.db = db
        self.enabled = enabled
        self._candidates: Dict[UUID, List[AdaptiveCandidate]] = {}
    
    def record_recognition(
        self,
        user_id: UUID,
        embedding: np.ndarray,
        confidence: float
    ) -> Optional[np.ndarray]:
        """
        Record a recognition event and potentially return embedding to add.
        
        Args:
            user_id: Recognized user ID
            embedding: Query embedding that matched
            confidence: Match confidence score
            
        Returns:
            Averaged embedding to add if criteria met, None otherwise
        """
        if not self.enabled:
            return None
        
        if confidence < self.CONFIDENCE_THRESHOLD:
            # Clear candidates for this user (non-consecutive)
            self._candidates.pop(user_id, None)
            return None
        
        # Add candidate
        candidate = AdaptiveCandidate(
            user_id=user_id,
            embedding=embedding,
            confidence=confidence,
            timestamp=datetime.now(timezone.utc)
        )
        
        if user_id not in self._candidates:
            self._candidates[user_id] = []
        
        self._candidates[user_id].append(candidate)
        
        # Check if we have enough consecutive matches
        if len(self._candidates[user_id]) >= self.CONSECUTIVE_REQUIRED:
            # Compute averaged embedding
            embeddings = [c.embedding for c in self._candidates[user_id]]
            avg_embedding = np.mean(np.stack(embeddings), axis=0)
            avg_embedding = avg_embedding / np.linalg.norm(avg_embedding)
            
            # Clear candidates
            self._candidates.pop(user_id, None)
            
            logger.info(f"Adaptive learning: adding embedding for user {user_id}")
            return avg_embedding.astype(np.float32)
        
        return None
    
    def clear_candidates(self, user_id: Optional[UUID] = None) -> None:
        """Clear candidate embeddings."""
        if user_id:
            self._candidates.pop(user_id, None)
        else:
            self._candidates.clear()
    
    def set_enabled(self, enabled: bool) -> None:
        """Enable or disable adaptive learning."""
        self.enabled = enabled
        if not enabled:
            self._candidates.clear()
