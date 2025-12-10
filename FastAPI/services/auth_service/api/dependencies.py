"""
FastAPI dependencies for authentication.
These can be imported by other services to protect their endpoints.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from functools import wraps

from shared.database.connection import get_db_session
from shared.models.user import User
from ..services.auth_service import AuthService


# Security scheme for JWT Bearer tokens
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db_session)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Usage:
        @router.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            return {"user": current_user.email}
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    auth_service = AuthService(db)
    result = auth_service.validate_access_token(token)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.error_message or "Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = auth_service.get_user_by_id(result.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    Raises 403 if user is deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    return current_user


def require_role(allowed_roles: List[str]):
    """
    Dependency factory to require specific roles.
    
    Usage:
        @router.get("/admin-only")
        async def admin_route(
            current_user: User = Depends(require_role(["admin"]))
        ):
            return {"message": "Admin access granted"}
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    
    return role_checker


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db_session)
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if not authenticated (doesn't raise error).
    
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        auth_service = AuthService(db)
        result = auth_service.validate_access_token(token)
        
        if result.success:
            return auth_service.get_user_by_id(result.user_id)
    except Exception:
        pass
    
    return None


# Convenience dependencies for common role checks
require_admin = require_role(["admin"])
require_mentor = require_role(["mentor", "admin"])
require_student = require_role(["student", "mentor", "admin"])
