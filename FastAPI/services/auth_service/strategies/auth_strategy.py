"""
Authentication Strategy interface implementing Strategy pattern.
"""
from abc import ABC, abstractmethod
from typing import Optional, Any
from dataclasses import dataclass
from uuid import UUID


@dataclass
class AuthResult:
    """
    Result of an authentication attempt.
    """
    success: bool
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None
    error_message: Optional[str] = None
    additional_data: Optional[dict] = None
    
    @classmethod
    def success_result(
        cls,
        user_id: UUID,
        email: str,
        role: str,
        additional_data: Optional[dict] = None
    ) -> 'AuthResult':
        """Create a successful auth result."""
        return cls(
            success=True,
            user_id=user_id,
            email=email,
            role=role,
            additional_data=additional_data
        )
    
    @classmethod
    def failure_result(cls, error_message: str) -> 'AuthResult':
        """Create a failed auth result."""
        return cls(success=False, error_message=error_message)


class IAuthStrategy(ABC):
    """
    Abstract base class for authentication strategies.
    
    Implements Strategy pattern to allow different authentication
    methods (JWT, API Key) to be used interchangeably.
    """
    
    @abstractmethod
    def authenticate(self, credentials: Any) -> AuthResult:
        """
        Authenticate using the provided credentials.
        
        Args:
            credentials: Authentication credentials (varies by strategy)
            
        Returns:
            AuthResult indicating success or failure
        """
        pass
    
    @abstractmethod
    def validate(self, token: Any) -> AuthResult:
        """
        Validate an existing token/credential.
        
        Args:
            token: Token or credential to validate
            
        Returns:
            AuthResult indicating validity
        """
        pass
