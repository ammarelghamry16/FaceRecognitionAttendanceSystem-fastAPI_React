"""
JWT Authentication Strategy.
"""
from typing import Any
from uuid import UUID
from sqlalchemy.orm import Session

from .auth_strategy import IAuthStrategy, AuthResult
from ..services.password_service import PasswordService
from ..services.token_service import TokenService
from ..repositories.user_repository import UserRepository


class JWTAuthStrategy(IAuthStrategy):
    """
    JWT-based authentication strategy.
    
    Used for authenticating users (students, mentors, admins)
    via email/password and JWT tokens.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.password_service = PasswordService()
        self.token_service = TokenService()
    
    def authenticate(self, credentials: dict) -> AuthResult:
        """
        Authenticate user with email and password.
        
        Args:
            credentials: Dict with 'email' and 'password' keys
            
        Returns:
            AuthResult with user info if successful
        """
        email = credentials.get('email')
        password = credentials.get('password')
        
        if not email or not password:
            return AuthResult.failure_result("Email and password are required")
        
        # Find user by email
        user = self.user_repo.find_by_email(email)
        if not user:
            return AuthResult.failure_result("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            return AuthResult.failure_result("Account is deactivated")
        
        # Verify password
        if not self.password_service.verify_password(password, user.password_hash):
            return AuthResult.failure_result("Invalid email or password")
        
        # Generate tokens
        tokens = self.token_service.create_token_pair(
            user_id=user.id,
            email=user.email,
            role=user.role
        )
        
        return AuthResult.success_result(
            user_id=user.id,
            email=user.email,
            role=user.role,
            additional_data={
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "full_name": user.full_name,
                "token_type": "bearer"
            }
        )
    
    def validate(self, token: str) -> AuthResult:
        """
        Validate a JWT access token.
        
        Args:
            token: JWT access token string
            
        Returns:
            AuthResult with user info if valid
        """
        payload = self.token_service.verify_access_token(token)
        
        if not payload:
            return AuthResult.failure_result("Invalid or expired token")
        
        try:
            user_id = UUID(payload.get("sub"))
        except (ValueError, TypeError):
            return AuthResult.failure_result("Invalid token payload")
        
        # Optionally verify user still exists and is active
        user = self.user_repo.find_by_id(user_id)
        if not user:
            return AuthResult.failure_result("User not found")
        
        if not user.is_active:
            return AuthResult.failure_result("Account is deactivated")
        
        return AuthResult.success_result(
            user_id=user.id,
            email=user.email,
            role=user.role,
            additional_data={"full_name": user.full_name}
        )
    
    def refresh_tokens(self, refresh_token: str) -> AuthResult:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: JWT refresh token
            
        Returns:
            AuthResult with new tokens if valid
        """
        payload = self.token_service.verify_refresh_token(refresh_token)
        
        if not payload:
            return AuthResult.failure_result("Invalid or expired refresh token")
        
        try:
            user_id = UUID(payload.get("sub"))
        except (ValueError, TypeError):
            return AuthResult.failure_result("Invalid token payload")
        
        # Get user to generate new tokens
        user = self.user_repo.find_by_id(user_id)
        if not user:
            return AuthResult.failure_result("User not found")
        
        if not user.is_active:
            return AuthResult.failure_result("Account is deactivated")
        
        # Generate new token pair
        tokens = self.token_service.create_token_pair(
            user_id=user.id,
            email=user.email,
            role=user.role
        )
        
        return AuthResult.success_result(
            user_id=user.id,
            email=user.email,
            role=user.role,
            additional_data={
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "full_name": user.full_name,
                "token_type": "bearer"
            }
        )
