"""
FastAPI routes for Auth Service.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import logging

from shared.database.connection import get_db_session
from shared.models.user import User
from ..services.auth_service import AuthService
from ..schemas.request import (
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ChangePasswordRequest,
    CreateAPIKeyRequest,
    UpdateUserRequest
)
from ..schemas.response import (
    UserResponse,
    TokenResponse,
    APIKeyResponse,
    APIKeyCreatedResponse,
    ValidateTokenResponse,
    ValidateAPIKeyResponse,
    LoginResponse
)
from .dependencies import (
    get_current_user,
    get_current_active_user,
    require_role
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Authentication Endpoints ====================

@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db_session)
):
    """
    Authenticate user and return tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token, refresh token, and user info.
    """
    auth_service = AuthService(db)
    result = auth_service.login(request.email, request.password)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.error_message or "Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = auth_service.get_user_by_id(result.user_id)
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        access_token=result.additional_data["access_token"],
        refresh_token=result.additional_data["refresh_token"],
        token_type="bearer"
    )


@router.post("/login/face", response_model=LoginResponse)
async def login_with_face(
    image: UploadFile = File(...),
    db: Session = Depends(get_db_session)
):
    """
    Authenticate user using face recognition.
    
    - **image**: Face image file
    
    Returns access token, refresh token, and user info if face is recognized.
    """
    from ...ai_service.services.recognition_service import RecognitionService
    
    content = await image.read()
    
    # Recognize face
    recognition_service = RecognitionService(db)
    result = recognition_service.recognize_face(content)
    
    if not result.matched:
        logger.warning(f"Face login failed: {result.message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.message or "Face not recognized",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Get user by ID
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(UUID(result.user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Generate tokens for the user
    tokens = auth_service.generate_tokens_for_user(user)
    
    logger.info(f"Face login successful for user {user.email} (confidence: {result.confidence:.2%})")
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer"
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db_session)
):
    """
    Register a new user.
    
    - **email**: Unique email address
    - **password**: Password (min 8 chars, must include uppercase, lowercase, digit)
    - **full_name**: User's full name
    - **role**: User role (student, mentor, admin) - default: student
    - **student_id**: Optional student ID
    """
    try:
        auth_service = AuthService(db)
        user = auth_service.register_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            role=request.role,
            student_id=request.student_id
        )
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db_session)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens.
    """
    auth_service = AuthService(db)
    result = auth_service.refresh_tokens(request.refresh_token)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.error_message or "Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return TokenResponse(
        access_token=result.additional_data["access_token"],
        refresh_token=result.additional_data["refresh_token"],
        token_type="bearer"
    )


@router.post("/validate", response_model=ValidateTokenResponse)
def validate_token(
    current_user: User = Depends(get_current_user)
):
    """
    Validate access token and return user info.
    
    Requires Bearer token in Authorization header.
    """
    return ValidateTokenResponse(
        valid=True,
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name
    )


# ==================== User Profile Endpoints ====================

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    request: UpdateUserRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Update current user's profile."""
    auth_service = AuthService(db)
    
    update_data = request.model_dump(exclude_unset=True)
    # Users can't change their own active status
    update_data.pop('is_active', None)
    
    if not update_data:
        return UserResponse.model_validate(current_user)
    
    updated_user = auth_service.update_user(current_user.id, **update_data)
    return UserResponse.model_validate(updated_user)


@router.post("/me/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Change current user's password."""
    try:
        auth_service = AuthService(db)
        auth_service.change_password(
            user_id=current_user.id,
            old_password=request.old_password,
            new_password=request.new_password
        )
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== User Management (Admin) ====================

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: str = Query(None),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Get all users (admin only)."""
    auth_service = AuthService(db)
    
    if role:
        users = auth_service.get_users_by_role(role, skip, limit)
    else:
        users = auth_service.user_repo.find_all(skip, limit)
    
    return [UserResponse.model_validate(u) for u in users]


@router.get("/users/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=1, description="Search query (name or student ID)"),
    role: str = Query(None, description="Filter by role (student, mentor, admin)"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_role(["admin", "mentor"])),
    db: Session = Depends(get_db_session)
):
    """
    Search users by name or student ID.
    
    - **q**: Search query (matches full_name or student_id)
    - **role**: Optional role filter
    - **limit**: Maximum results to return (default 20, max 50)
    
    Returns matching users sorted by relevance.
    """
    auth_service = AuthService(db)
    users = auth_service.user_repo.search(q, role, limit)
    return [UserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Get a specific user (admin only)."""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    request: UpdateUserRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Update a user (admin only)."""
    auth_service = AuthService(db)
    
    update_data = request.model_dump(exclude_unset=True)
    if not update_data:
        user = auth_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserResponse.model_validate(user)
    
    updated_user = auth_service.update_user(user_id, **update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(updated_user)


@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Deactivate a user (admin only)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    auth_service = AuthService(db)
    user = auth_service.deactivate_user(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Activate a user (admin only)."""
    auth_service = AuthService(db)
    user = auth_service.activate_user(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


# ==================== API Key Management (Admin) ====================

@router.post("/api-keys", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Create a new API key for an Edge Agent (admin only).
    
    **Important**: The API key is only shown once in the response.
    Store it securely as it cannot be retrieved again.
    """
    auth_service = AuthService(db)
    result = auth_service.create_api_key(
        edge_agent_id=request.edge_agent_id,
        description=request.description,
        expires_in_days=request.expires_in_days
    )
    
    return APIKeyCreatedResponse(
        api_key=result["api_key"],
        key_info=APIKeyResponse(**result["key_info"])
    )


@router.get("/api-keys", response_model=List[APIKeyResponse])
def get_all_api_keys(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Get all API keys (admin only)."""
    auth_service = AuthService(db)
    keys = auth_service.get_all_api_keys(skip, limit)
    return [APIKeyResponse.model_validate(k) for k in keys]


@router.get("/api-keys/agent/{edge_agent_id}", response_model=List[APIKeyResponse])
def get_api_keys_for_agent(
    edge_agent_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Get all API keys for a specific Edge Agent (admin only)."""
    auth_service = AuthService(db)
    keys = auth_service.get_api_keys_for_agent(edge_agent_id)
    return [APIKeyResponse.model_validate(k) for k in keys]


@router.post("/api-keys/validate", response_model=ValidateAPIKeyResponse)
def validate_api_key(
    api_key: str,
    db: Session = Depends(get_db_session)
):
    """
    Validate an API key.
    
    This endpoint is used by Edge Agents to verify their API key.
    """
    auth_service = AuthService(db)
    result = auth_service.validate_api_key(api_key)
    
    if result.success:
        return ValidateAPIKeyResponse(
            valid=True,
            edge_agent_id=result.additional_data.get("edge_agent_id"),
            description=result.additional_data.get("description")
        )
    
    return ValidateAPIKeyResponse(valid=False)


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Revoke (deactivate) an API key (admin only)."""
    auth_service = AuthService(db)
    success = auth_service.revoke_api_key(key_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    return None


@router.delete("/api-keys/{key_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key_permanently(
    key_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Permanently delete an API key (admin only)."""
    auth_service = AuthService(db)
    success = auth_service.delete_api_key(key_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    return None


@router.post("/api-keys/cleanup")
def cleanup_expired_keys(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Delete all expired API keys (admin only)."""
    auth_service = AuthService(db)
    count = auth_service.cleanup_expired_keys()
    return {"deleted_count": count}
