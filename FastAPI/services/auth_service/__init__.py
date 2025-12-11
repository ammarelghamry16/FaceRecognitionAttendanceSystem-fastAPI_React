"""
Auth Service Module

Provides authentication and authorization functionality:
- User registration and login (JWT)
- Token management (access + refresh tokens)
- API key management for Edge Agents
- Role-based access control

Usage:
    from services.auth_service.api import router as auth_router
    from services.auth_service.api.dependencies import get_current_user, require_role
    
    # In your routes:
    @router.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"user": current_user.email}
    
    @router.get("/admin-only")
    async def admin_route(current_user: User = Depends(require_role(["admin"]))):
        return {"message": "Admin access"}
"""
from .api.routes import router
from .api.dependencies import (
    get_current_user,
    get_current_active_user,
    get_optional_user,
    require_role,
    require_admin,
    require_mentor,
    require_student
)
from .services.auth_service import AuthService
from .services.token_service import TokenService
from .services.password_service import PasswordService

__all__ = [
    "router",
    "get_current_user",
    "get_current_active_user",
    "get_optional_user",
    "require_role",
    "require_admin",
    "require_mentor",
    "require_student",
    "AuthService",
    "TokenService",
    "PasswordService"
]
