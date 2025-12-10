"""
Auth Service API
"""
from .routes import router
from .dependencies import get_current_user, get_current_active_user, require_role

__all__ = ["router", "get_current_user", "get_current_active_user", "require_role"]
