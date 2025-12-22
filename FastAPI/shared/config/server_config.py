"""
Server Configuration Module
Handles server mode (ADMIN/USER) and cookie settings for multi-server deployment.
"""
import os
from enum import Enum
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class ServerMode(str, Enum):
    """Server mode enumeration for multi-server deployment."""
    ADMIN = "ADMIN"
    USER = "USER"


class ServerConfig(BaseSettings):
    """
    Server configuration settings loaded from environment variables.
    
    Attributes:
        server_mode: The mode this server runs in (ADMIN or USER)
        server_port: The port the server listens on
        cookie_secure: Whether cookies should only be sent over HTTPS
        cookie_samesite: SameSite cookie attribute (lax, strict, none)
        cookie_domain: Optional domain for cross-subdomain cookies
    """
    server_mode: ServerMode = ServerMode.USER
    server_port: int = 8000
    cookie_secure: bool = False  # True in production
    cookie_samesite: str = "lax"
    cookie_domain: Optional[str] = None
    
    # Cookie expiration settings
    access_token_max_age: int = 1800  # 30 minutes
    refresh_token_max_age: int = 604800  # 7 days
    remember_me_max_age: int = 2592000  # 30 days
    user_cookie_max_age: int = 1800  # 30 minutes (same as access token)
    
    @field_validator('server_mode', mode='before')
    @classmethod
    def normalize_server_mode(cls, v):
        """Normalize server mode to uppercase for case-insensitive matching."""
        if isinstance(v, str):
            upper_v = v.upper()
            if upper_v in ('ADMIN', 'USER'):
                return upper_v
        return v
    
    class Config:
        env_prefix = ""
        case_sensitive = False


# Singleton instance
_server_config: Optional[ServerConfig] = None


def get_server_config() -> ServerConfig:
    """
    Get the server configuration singleton.
    
    Returns:
        ServerConfig: The server configuration instance
    """
    global _server_config
    if _server_config is None:
        _server_config = ServerConfig()
    return _server_config


def reset_server_config() -> None:
    """Reset the server configuration singleton (useful for testing)."""
    global _server_config
    _server_config = None


def is_admin_server() -> bool:
    """Check if the current server is running in ADMIN mode."""
    return get_server_config().server_mode == ServerMode.ADMIN


def is_user_server() -> bool:
    """Check if the current server is running in USER mode."""
    return get_server_config().server_mode == ServerMode.USER
