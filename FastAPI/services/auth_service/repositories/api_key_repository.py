"""
API Key Repository implementing Repository pattern.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..models.api_key import APIKey


class APIKeyRepository:
    """
    Repository for API Key data access operations.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, api_key: APIKey) -> APIKey:
        """
        Create a new API key.
        
        Args:
            api_key: APIKey object to create
            
        Returns:
            Created API key
        """
        try:
            self.db.add(api_key)
            self.db.flush()
            self.db.refresh(api_key)
            return api_key
        except IntegrityError:
            self.db.rollback()
            raise ValueError("API key already exists")
    
    def find_by_id(self, key_id: UUID) -> Optional[APIKey]:
        """Find API key by ID."""
        return self.db.query(APIKey).filter(APIKey.id == key_id).first()
    
    def find_by_key_hash(self, key_hash: str) -> Optional[APIKey]:
        """
        Find API key by its hash.
        
        Args:
            key_hash: Hashed API key
            
        Returns:
            APIKey if found, None otherwise
        """
        return self.db.query(APIKey).filter(APIKey.key_hash == key_hash).first()
    
    def find_by_edge_agent_id(self, edge_agent_id: str) -> List[APIKey]:
        """Find all API keys for an edge agent."""
        return self.db.query(APIKey).filter(APIKey.edge_agent_id == edge_agent_id).all()
    
    def find_active_keys(self, skip: int = 0, limit: int = 100) -> List[APIKey]:
        """Find all active API keys."""
        return self.db.query(APIKey).filter(APIKey.is_active == True).offset(skip).limit(limit).all()
    
    def find_all(self, skip: int = 0, limit: int = 100) -> List[APIKey]:
        """Get all API keys with pagination."""
        return self.db.query(APIKey).offset(skip).limit(limit).all()
    
    def update(self, key_id: UUID, **kwargs) -> Optional[APIKey]:
        """
        Update API key fields.
        
        Args:
            key_id: UUID of the API key
            **kwargs: Fields to update
            
        Returns:
            Updated API key or None if not found
        """
        api_key = self.find_by_id(key_id)
        if not api_key:
            return None
        
        for key, value in kwargs.items():
            if hasattr(api_key, key) and value is not None:
                setattr(api_key, key, value)
        
        self.db.flush()
        self.db.refresh(api_key)
        return api_key
    
    def update_last_used(self, key_id: UUID) -> Optional[APIKey]:
        """Update the last_used_at timestamp."""
        return self.update(key_id, last_used_at=datetime.now(timezone.utc))
    
    def delete(self, key_id: UUID) -> bool:
        """
        Delete an API key.
        
        Args:
            key_id: UUID of the API key
            
        Returns:
            True if deleted, False if not found
        """
        api_key = self.find_by_id(key_id)
        if not api_key:
            return False
        
        self.db.delete(api_key)
        self.db.flush()
        return True
    
    def deactivate(self, key_id: UUID) -> Optional[APIKey]:
        """Deactivate an API key."""
        return self.update(key_id, is_active=False)
    
    def activate(self, key_id: UUID) -> Optional[APIKey]:
        """Activate an API key."""
        return self.update(key_id, is_active=True)
    
    def delete_expired(self) -> int:
        """
        Delete all expired API keys.
        
        Returns:
            Number of keys deleted
        """
        now = datetime.now(timezone.utc)
        result = self.db.query(APIKey).filter(
            APIKey.expires_at.isnot(None),
            APIKey.expires_at < now
        ).delete(synchronize_session=False)
        self.db.flush()
        return result
