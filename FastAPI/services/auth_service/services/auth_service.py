"""
Auth Service - Main orchestrator for authentication operations.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from ..repositories.user_repository import UserRepository
from ..repositories.api_key_repository import APIKeyRepository
from ..strategies.jwt_strategy import JWTAuthStrategy
from ..strategies.api_key_strategy import APIKeyAuthStrategy
from ..strategies.auth_strategy import AuthResult
from .password_service import PasswordService
from .token_service import TokenService
from .student_id_service import StudentIdService
from ..models.api_key import APIKey
from shared.models.user import User


class AuthService:
    """
    Main authentication service orchestrating all auth operations.
    
    Provides a unified interface for:
    - User registration and login
    - Token management (access + refresh)
    - API key management for Edge Agents
    - User management
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.api_key_repo = APIKeyRepository(db)
        self.password_service = PasswordService()
        self.token_service = TokenService()
        self.student_id_service = StudentIdService(db)
        self.jwt_strategy = JWTAuthStrategy(db)
        self.api_key_strategy = APIKeyAuthStrategy(db)
    
    # ==================== User Authentication ====================
    
    def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str = "student",
        student_id: Optional[str] = None
    ) -> User:
        """
        Register a new user.
        
        Args:
            email: User's email address
            password: Plain text password
            full_name: User's full name
            role: User role (student, mentor, admin)
            student_id: Optional student ID (auto-generated for students if not provided)
            
        Returns:
            Created User object
            
        Raises:
            ValueError: If email already exists or invalid role
        """
        # Validate role
        valid_roles = ["student", "mentor", "admin"]
        if role not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
        
        # Check if email exists
        if self.user_repo.email_exists(email):
            raise ValueError(f"Email '{email}' is already registered")
        
        # Hash password
        password_hash = self.password_service.hash_password(password)
        
        # Auto-generate student ID for students if not provided
        if role == "student":
            if not student_id:
                enrollment_year = datetime.now().year
                student_id = self.student_id_service.generate_student_id(enrollment_year)
        
        # Create user
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
            student_id=student_id,
            is_active=True
        )
        
        return self.user_repo.create(user)
    
    def login(self, email: str, password: str) -> AuthResult:
        """
        Authenticate user and return tokens.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            AuthResult with tokens if successful
        """
        return self.jwt_strategy.authenticate({
            "email": email,
            "password": password
        })
    
    def validate_access_token(self, token: str) -> AuthResult:
        """
        Validate an access token.
        
        Args:
            token: JWT access token
            
        Returns:
            AuthResult with user info if valid
        """
        return self.jwt_strategy.validate(token)
    
    def refresh_tokens(self, refresh_token: str) -> AuthResult:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: JWT refresh token
            
        Returns:
            AuthResult with new tokens if valid
        """
        return self.jwt_strategy.refresh_tokens(refresh_token)
    
    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        return self.user_repo.find_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.user_repo.find_by_email(email)
    
    def update_user(self, user_id: UUID, **kwargs) -> Optional[User]:
        """Update user fields."""
        # If updating password, hash it
        if 'password' in kwargs:
            kwargs['password_hash'] = self.password_service.hash_password(kwargs.pop('password'))
        return self.user_repo.update(user_id, **kwargs)
    
    def change_password(self, user_id: UUID, old_password: str, new_password: str) -> bool:
        """
        Change user's password.
        
        Args:
            user_id: User's UUID
            old_password: Current password
            new_password: New password
            
        Returns:
            True if successful
            
        Raises:
            ValueError: If old password is incorrect
        """
        user = self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if not self.password_service.verify_password(old_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        
        new_hash = self.password_service.hash_password(new_password)
        self.user_repo.update(user_id, password_hash=new_hash)
        return True
    
    def deactivate_user(self, user_id: UUID) -> Optional[User]:
        """Deactivate a user account."""
        return self.user_repo.deactivate(user_id)
    
    def activate_user(self, user_id: UUID) -> Optional[User]:
        """Activate a user account."""
        return self.user_repo.activate(user_id)
    
    def get_users_by_role(self, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with a specific role."""
        return self.user_repo.find_by_role(role, skip, limit)
    
    # ==================== API Key Management ====================
    
    def create_api_key(
        self,
        edge_agent_id: str,
        description: Optional[str] = None,
        expires_in_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a new API key for an Edge Agent.
        
        Args:
            edge_agent_id: Identifier for the edge agent
            description: Optional description
            expires_in_days: Optional expiration in days
            
        Returns:
            Dict with 'api_key' (plain text, only shown once) and 'key_info'
        """
        # Generate random API key
        plain_key = self.password_service.generate_api_key()
        key_hash = self.password_service.hash_api_key(plain_key)
        
        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
        
        # Create API key record
        api_key = APIKey(
            key_hash=key_hash,
            edge_agent_id=edge_agent_id,
            description=description,
            expires_at=expires_at,
            is_active=True
        )
        
        created_key = self.api_key_repo.create(api_key)
        
        return {
            "api_key": plain_key,  # Only returned once!
            "key_info": {
                "id": str(created_key.id),
                "edge_agent_id": created_key.edge_agent_id,
                "description": created_key.description,
                "expires_at": created_key.expires_at.isoformat() if created_key.expires_at else None,
                "created_at": created_key.created_at.isoformat()
            }
        }
    
    def validate_api_key(self, api_key: str) -> AuthResult:
        """
        Validate an API key.
        
        Args:
            api_key: Plain text API key
            
        Returns:
            AuthResult with edge agent info if valid
        """
        return self.api_key_strategy.validate(api_key)
    
    def revoke_api_key(self, key_id: UUID) -> bool:
        """
        Revoke (deactivate) an API key.
        
        Args:
            key_id: UUID of the API key
            
        Returns:
            True if successful
        """
        result = self.api_key_repo.deactivate(key_id)
        return result is not None
    
    def delete_api_key(self, key_id: UUID) -> bool:
        """Delete an API key permanently."""
        return self.api_key_repo.delete(key_id)
    
    def get_api_keys_for_agent(self, edge_agent_id: str) -> List[APIKey]:
        """Get all API keys for an edge agent."""
        return self.api_key_repo.find_by_edge_agent_id(edge_agent_id)
    
    def get_all_api_keys(self, skip: int = 0, limit: int = 100) -> List[APIKey]:
        """Get all API keys (admin only)."""
        return self.api_key_repo.find_all(skip, limit)
    
    def cleanup_expired_keys(self) -> int:
        """Delete all expired API keys."""
        return self.api_key_repo.delete_expired()
