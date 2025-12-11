"""
Face Encoding Repository for managing face embeddings.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from ..models.face_encoding import FaceEncoding


class FaceEncodingRepository:
    """Repository for FaceEncoding data access."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, encoding: FaceEncoding) -> FaceEncoding:
        """Create a new face encoding."""
        self.db.add(encoding)
        self.db.flush()
        self.db.refresh(encoding)
        return encoding
    
    def find_by_id(self, encoding_id: UUID) -> Optional[FaceEncoding]:
        """Find encoding by ID."""
        return self.db.query(FaceEncoding).filter(
            FaceEncoding.id == encoding_id
        ).first()
    
    def find_by_user(self, user_id: UUID) -> List[FaceEncoding]:
        """Find all encodings for a user."""
        return self.db.query(FaceEncoding).filter(
            FaceEncoding.user_id == user_id
        ).all()
    
    def find_all(self, skip: int = 0, limit: int = 1000) -> List[FaceEncoding]:
        """Get all encodings with pagination."""
        return self.db.query(FaceEncoding).offset(skip).limit(limit).all()
    
    def get_all_user_encodings(self) -> List[Tuple[UUID, List[float]]]:
        """
        Get all encodings grouped by user for matching.
        
        Returns:
            List of (user_id, encoding) tuples
        """
        encodings = self.db.query(FaceEncoding).all()
        return [(e.user_id, e.encoding) for e in encodings]
    
    def delete(self, encoding_id: UUID) -> bool:
        """Delete an encoding."""
        encoding = self.find_by_id(encoding_id)
        if not encoding:
            return False
        self.db.delete(encoding)
        self.db.flush()
        return True
    
    def delete_by_user(self, user_id: UUID) -> int:
        """Delete all encodings for a user."""
        result = self.db.query(FaceEncoding).filter(
            FaceEncoding.user_id == user_id
        ).delete(synchronize_session=False)
        self.db.flush()
        return result
    
    def count_by_user(self, user_id: UUID) -> int:
        """Count encodings for a user."""
        return self.db.query(FaceEncoding).filter(
            FaceEncoding.user_id == user_id
        ).count()
    
    def user_has_encodings(self, user_id: UUID) -> bool:
        """Check if user has any encodings."""
        return self.count_by_user(user_id) > 0
