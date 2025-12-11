"""
Token Service for JWT token generation and validation.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from uuid import UUID
import jwt
from dotenv import load_dotenv

load_dotenv()


class TokenService:
    """
    Service for JWT token operations.
    Handles access token and refresh token generation/validation.
    """
    
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'your-super-secret-key-change-in-production')
        self.algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.access_token_expire_minutes = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
        self.refresh_token_expire_days = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRE_DAYS', '7'))
    
    def create_access_token(
        self,
        user_id: UUID,
        email: str,
        role: str,
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a JWT access token.
        
        Args:
            user_id: User's UUID
            email: User's email
            role: User's role (student, mentor, admin)
            additional_claims: Optional additional JWT claims
            
        Returns:
            Encoded JWT access token
        """
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=self.access_token_expire_minutes)
        
        payload = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "type": "access",
            "iat": now,
            "exp": expire
        }
        
        if additional_claims:
            payload.update(additional_claims)
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: UUID) -> str:
        """
        Create a JWT refresh token.
        
        Refresh tokens have longer expiry and minimal claims.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Encoded JWT refresh token
        """
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=self.refresh_token_expire_days)
        
        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "iat": now,
            "exp": expire
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_token_pair(
        self,
        user_id: UUID,
        email: str,
        role: str
    ) -> Dict[str, str]:
        """
        Create both access and refresh tokens.
        
        Args:
            user_id: User's UUID
            email: User's email
            role: User's role
            
        Returns:
            Dict with 'access_token' and 'refresh_token'
        """
        return {
            "access_token": self.create_access_token(user_id, email, role),
            "refresh_token": self.create_refresh_token(user_id)
        }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify an access token specifically.
        
        Args:
            token: JWT access token
            
        Returns:
            Decoded payload if valid access token, None otherwise
        """
        payload = self.verify_token(token)
        if payload and payload.get("type") == "access":
            return payload
        return None
    
    def verify_refresh_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a refresh token specifically.
        
        Args:
            token: JWT refresh token
            
        Returns:
            Decoded payload if valid refresh token, None otherwise
        """
        payload = self.verify_token(token)
        if payload and payload.get("type") == "refresh":
            return payload
        return None
    
    def get_user_id_from_token(self, token: str) -> Optional[UUID]:
        """
        Extract user ID from a token.
        
        Args:
            token: JWT token
            
        Returns:
            User UUID if valid, None otherwise
        """
        payload = self.verify_token(token)
        if payload:
            try:
                return UUID(payload.get("sub"))
            except (ValueError, TypeError):
                return None
        return None
    
    def is_token_expired(self, token: str) -> bool:
        """
        Check if a token is expired.
        
        Args:
            token: JWT token
            
        Returns:
            True if expired or invalid, False if still valid
        """
        return self.verify_token(token) is None
