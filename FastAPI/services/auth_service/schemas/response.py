"""
Response schemas for Auth Service.
"""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserResponse(BaseModel):
    """User response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    student_id: Optional[str] = None
    group: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes in seconds


class LoginResponse(BaseModel):
    """Login response with user info and tokens."""
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class APIKeyResponse(BaseModel):
    """API key response schema (without the actual key)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    edge_agent_id: str
    description: Optional[str] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime


class APIKeyCreatedResponse(BaseModel):
    """Response when creating a new API key (includes the key once)."""
    api_key: str  # Only shown once!
    key_info: APIKeyResponse


class AuthResultResponse(BaseModel):
    """Generic auth result response."""
    success: bool
    message: Optional[str] = None
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None


class ValidateTokenResponse(BaseModel):
    """Token validation response."""
    valid: bool
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None


class ValidateAPIKeyResponse(BaseModel):
    """API key validation response."""
    valid: bool
    edge_agent_id: Optional[str] = None
    description: Optional[str] = None
