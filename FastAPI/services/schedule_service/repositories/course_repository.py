"""
Course repository for data access.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from .base_repository import BaseRepository
from ..models.course import Course


class CourseRepository(BaseRepository[Course]):
    """
    Repository for managing Course entities.
    """
    
    def __init__(self, db: Session):
        super().__init__(Course, db)
    
    def find_by_code(self, code: str) -> Optional[Course]:
        """
        Find a course by its code.
        
        Args:
            code: Course code
            
        Returns:
            Course if found, None otherwise
        """
        return self.db.query(self.model).filter(self.model.code == code).first()
    
    def code_exists(self, code: str) -> bool:
        """
        Check if a course code already exists.
        
        Args:
            code: Course code to check
            
        Returns:
            True if code exists, False otherwise
        """
        return self.db.query(self.model).filter(self.model.code == code).first() is not None
    
    def search_by_name(self, name: str, skip: int = 0, limit: int = 100) -> List[Course]:
        """
        Search courses by name (case-insensitive partial match).
        
        Args:
            name: Name to search for
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching courses
        """
        return (
            self.db.query(self.model)
            .filter(self.model.name.ilike(f"%{name}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )
