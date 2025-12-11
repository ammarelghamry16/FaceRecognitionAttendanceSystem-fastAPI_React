"""
API Key Authentication Strategy.
"""
from typing import Any
from sqlalchemy.orm import Session

from .auth_strategy import IAuthStrategy, AuthResult
from ..services.password_service import PasswordService
from ..repositories.api_key_repository import APIKeyRepository


class APIKeyAuthStrategy(IAuthStrategy):
    """
    API Key-based authentication strategy.
    
    Used for authenticating Edge Agents via API keys.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.api_key_repo = APIKeyRepository(db)
        self.password_service = PasswordService()
    
    def authenticate(self, credentials: dict) -> AuthResult:
        """
        Authenticate using API key.
        
        For API keys, authenticate and validate are the same operation.
        
        Args:
            credentials: Dict with 'api_key' key
            
        Returns:
            AuthResult with edge agent info if successful
        """
        api_key = credentials.get('api_key')
        
        if not api_key:
            return AuthResult.failure_result("API key is required")
        
        return self.validate(api_key)
    
    def validate(self, api_key: str) -> AuthResult:
        """
        Validate an API key.
        
        Args:
            api_key: Plain text API key
            
        Returns:
            AuthResult with edge agent info if valid
        """
        # Hash the provided key
        key_hash = self.password_service.hash_api_key(api_key)
        
        # Find the key in database
        api_key_record = self.api_key_repo.find_by_key_hash(key_hash)
        
        if not api_key_record:
            return AuthResult.failure_result("Invalid API key")
        
        # Check if key is valid (active and not expired)
        if not api_key_record.is_valid():
            if not api_key_record.is_active:
                return AuthResult.failure_result("API key is deactivated")
            if api_key_record.is_expired():
                return AuthResult.failure_result("API key has expired")
            return AuthResult.failure_result("Invalid API key")
        
        # Update last used timestamp
        self.api_key_repo.update_last_used(api_key_record.id)
        
        return AuthResult.success_result(
            user_id=api_key_record.id,  # Using key ID as identifier
            email=None,
            role="edge_agent",
            additional_data={
                "edge_agent_id": api_key_record.edge_agent_id,
                "description": api_key_record.description
            }
        )
