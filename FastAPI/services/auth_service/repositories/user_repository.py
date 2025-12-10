"""
User Repository implementing Repository pattern.
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from shared.models.user import User


class UserRepository:
    """
    Repository for User data access operations.
    Implements Repository pattern for clean data access abstraction.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user: User) -> User:
        """
        Create a new user.
        
        Args:
            user: User object to create
            
        Returns:
            Created user
            
        Raises:
            IntegrityError: If email already exists
        """
        try:
            self.db.add(user)
            self.db.flush()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"User with email '{user.email}' already exists")
    
    def find_by_id(self, user_id: UUID) -> Optional[User]:
        """Find user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def find_by_email(self, email: str) -> Optional[User]:
        """
        Find user by email address.
        
        Args:
            email: Email address to search for
            
        Returns:
            User if found, None otherwise
        """
        return self.db.query(User).filter(User.email == email).first()
    
    def find_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def find_by_role(self, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Find all users with a specific role."""
        return self.db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
    
    def find_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Find all active users."""
        return self.db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    
    def update(self, user_id: UUID, **kwargs) -> Optional[User]:
        """
        Update user fields.
        
        Args:
            user_id: UUID of the user
            **kwargs: Fields to update
            
        Returns:
            Updated user or None if not found
        """
        user = self.find_by_id(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        self.db.flush()
        self.db.refresh(user)
        return user
    
    def delete(self, user_id: UUID) -> bool:
        """
        Delete a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            True if deleted, False if not found
        """
        user = self.find_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.flush()
        return True
    
    def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        return self.db.query(User).filter(User.email == email).first() is not None
    
    def deactivate(self, user_id: UUID) -> Optional[User]:
        """Deactivate a user account."""
        return self.update(user_id, is_active=False)
    
    def activate(self, user_id: UUID) -> Optional[User]:
        """Activate a user account."""
        return self.update(user_id, is_active=True)
