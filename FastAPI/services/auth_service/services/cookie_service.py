"""
Cookie Service for HTTP-only cookie-based authentication.

Handles setting and clearing authentication cookies, user data cookies,
and remember me cookies for the multi-server deployment.
"""
import json
import base64
from typing import Optional
from fastapi import Response
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os

from shared.config.server_config import get_server_config, ServerConfig


class CookieService:
    """
    Service for managing authentication cookies.
    
    Handles:
    - HTTP-only access and refresh token cookies
    - Non-HTTP-only user data cookie (frontend readable)
    - Remember me cookies with encryption
    """
    
    def __init__(self, config: Optional[ServerConfig] = None):
        """
        Initialize the cookie service.
        
        Args:
            config: Server configuration. If None, uses the singleton.
        """
        self.config = config or get_server_config()
        self._fernet = self._create_fernet()
    
    def _create_fernet(self) -> Fernet:
        """Create a Fernet instance for encrypting remember me data."""
        # Use JWT_SECRET_KEY as the base for encryption key
        secret = os.environ.get('JWT_SECRET_KEY', 'default-secret-key-change-me')
        salt = b'remember_me_salt'  # Static salt for consistency
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        return Fernet(key)
    
    def set_auth_cookies(
        self,
        response: Response,
        access_token: str,
        refresh_token: str
    ) -> None:
        """
        Set HTTP-only cookies for authentication tokens.
        
        Args:
            response: FastAPI Response object
            access_token: JWT access token
            refresh_token: JWT refresh token
        """
        # Access token cookie - HTTP-only, sent with all requests
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=self.config.cookie_secure,
            samesite=self.config.cookie_samesite,
            max_age=self.config.access_token_max_age,
            path="/",
            domain=self.config.cookie_domain
        )
        
        # Refresh token cookie - HTTP-only, only sent to refresh endpoint
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=self.config.cookie_secure,
            samesite=self.config.cookie_samesite,
            max_age=self.config.refresh_token_max_age,
            path="/api/auth/refresh",
            domain=self.config.cookie_domain
        )
    
    def set_user_cookie(self, response: Response, user_data: dict) -> None:
        """
        Set non-HTTP-only cookie for user data (frontend readable).
        
        Args:
            response: FastAPI Response object
            user_data: User data dictionary to store
        """
        # Serialize user data to JSON
        user_json = json.dumps(user_data)
        
        response.set_cookie(
            key="user",
            value=user_json,
            httponly=False,  # Frontend needs to read this
            secure=self.config.cookie_secure,
            samesite=self.config.cookie_samesite,
            max_age=self.config.user_cookie_max_age,
            path="/",
            domain=self.config.cookie_domain
        )
    
    def set_remember_me_cookies(
        self,
        response: Response,
        email: str,
        password: str
    ) -> None:
        """
        Set remember me cookies with encrypted password.
        
        Args:
            response: FastAPI Response object
            email: User's email address
            password: User's password (will be encrypted)
        """
        # Encrypt the password
        encrypted_password = self._fernet.encrypt(password.encode()).decode()
        
        # Email cookie - not HTTP-only so frontend can read it
        response.set_cookie(
            key="remember_email",
            value=email,
            httponly=False,
            secure=self.config.cookie_secure,
            samesite=self.config.cookie_samesite,
            max_age=self.config.remember_me_max_age,
            path="/",
            domain=self.config.cookie_domain
        )
        
        # Encrypted password cookie
        response.set_cookie(
            key="remember_password",
            value=encrypted_password,
            httponly=False,
            secure=self.config.cookie_secure,
            samesite=self.config.cookie_samesite,
            max_age=self.config.remember_me_max_age,
            path="/",
            domain=self.config.cookie_domain
        )
    
    def decrypt_remember_password(self, encrypted_password: str) -> Optional[str]:
        """
        Decrypt a remember me password.
        
        Args:
            encrypted_password: The encrypted password from cookie
            
        Returns:
            The decrypted password, or None if decryption fails
        """
        try:
            return self._fernet.decrypt(encrypted_password.encode()).decode()
        except Exception:
            return None
    
    def clear_auth_cookies(self, response: Response) -> None:
        """
        Clear all authentication cookies.
        
        Args:
            response: FastAPI Response object
        """
        # Clear access token
        response.delete_cookie(
            key="access_token",
            path="/",
            domain=self.config.cookie_domain
        )
        
        # Clear refresh token
        response.delete_cookie(
            key="refresh_token",
            path="/api/auth/refresh",
            domain=self.config.cookie_domain
        )
        
        # Clear user cookie
        response.delete_cookie(
            key="user",
            path="/",
            domain=self.config.cookie_domain
        )
    
    def clear_remember_me_cookies(self, response: Response) -> None:
        """
        Clear remember me cookies.
        
        Args:
            response: FastAPI Response object
        """
        response.delete_cookie(
            key="remember_email",
            path="/",
            domain=self.config.cookie_domain
        )
        
        response.delete_cookie(
            key="remember_password",
            path="/",
            domain=self.config.cookie_domain
        )


# Singleton instance
_cookie_service: Optional[CookieService] = None


def get_cookie_service() -> CookieService:
    """Get the cookie service singleton."""
    global _cookie_service
    if _cookie_service is None:
        _cookie_service = CookieService()
    return _cookie_service


def reset_cookie_service() -> None:
    """Reset the cookie service singleton (useful for testing)."""
    global _cookie_service
    _cookie_service = None
