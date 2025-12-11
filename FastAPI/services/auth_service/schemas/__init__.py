"""
Auth Service Schemas
"""
from .request import (
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
    CreateAPIKeyRequest,
    UpdateUserRequest
)
from .response import (
    TokenResponse,
    UserResponse,
    APIKeyResponse,
    APIKeyCreatedResponse,
    AuthResultResponse
)

__all__ = [
    "LoginRequest",
    "RegisterRequest", 
    "RefreshTokenRequest",
    "ChangePasswordRequest",
    "CreateAPIKeyRequest",
    "UpdateUserRequest",
    "TokenResponse",
    "UserResponse",
    "APIKeyResponse",
    "APIKeyCreatedResponse",
    "AuthResultResponse"
]
