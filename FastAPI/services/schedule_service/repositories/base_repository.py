"""
Base repository implementing the Repository Pattern with SQLAlchemy ORM.
"""
from typing import TypeVar, Generic, List, Optional, Type
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Base repository providing common CRUD operations for all entities.
    
    Usage:
        class CourseRepository(BaseRepository[Course]):
            def __init__(self, db: Session):
                super().__init__(Course, db)
    """
    
    def __init__(self, model: Type[T], db: Session):
        """
        Args:
            model: SQLAlchemy model class
            db: SQLAlchemy database session
        """
        self.model = model
        self.db = db
    
    def create(self, entity: T) -> T:
        """
        Create a new record in the database.
        
        Args:
            entity: Model instance to create
            
        Returns:
            Created entity with generated ID
        """
        try:
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)
            return entity
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    
    def find_by_id(self, id: UUID) -> Optional[T]:
        """
        Find a record by its ID.
        
        Args:
            id: UUID of the record
            
        Returns:
            Entity if found, None otherwise
        """
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def find_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Get all records with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of entities
        """
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def update(self, id: UUID, **kwargs) -> Optional[T]:
        """
        Update a record by ID.
        
        Args:
            id: UUID of the record to update
            **kwargs: Fields to update
            
        Returns:
            Updated entity if found, None otherwise
        """
        try:
            entity = self.find_by_id(id)
            if entity:
                for key, value in kwargs.items():
                    if hasattr(entity, key):
                        setattr(entity, key, value)
                self.db.commit()
                self.db.refresh(entity)
            return entity
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    
    def delete(self, id: UUID) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: UUID of the record to delete
            
        Returns:
            True if deleted, False if not found
        """
        try:
            entity = self.find_by_id(id)
            if entity:
                self.db.delete(entity)
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    
    def count(self) -> int:
        """
        Count total records.
        
        Returns:
            Total number of records
        """
        return self.db.query(self.model).count()
    
    def exists(self, id: UUID) -> bool:
        """
        Check if a record exists by ID.
        
        Args:
            id: UUID of the record
            
        Returns:
            True if exists, False otherwise
        """
        return self.db.query(self.model).filter(self.model.id == id).first() is not None
