"""
Role Gate Middleware for Multi-Server Deployment.

Validates that users can only login to servers appropriate for their role:
- ADMIN server: Only admin users
- USER server: Only student and mentor users
"""
from typing import List
from fastapi import HTTPException, status

from shared.config.server_config import ServerMode, get_server_config


# Roles allowed on each server type
ADMIN_ALLOWED_ROLES: List[str] = ["admin"]
USER_ALLOWED_ROLES: List[str] = ["student", "mentor"]


class RoleGateError(Exception):
    """Exception raised when a user's role is not allowed on the current server."""
    
    def __init__(self, message: str, user_role: str, server_mode: ServerMode):
        self.message = message
        self.user_role = user_role
        self.server_mode = server_mode
        super().__init__(self.message)


def validate_role_for_server(user_role: str) -> bool:
    """
    Check if a user's role is allowed on the current server.
    
    Args:
        user_role: The role of the user attempting to login
        
    Returns:
        True if the role is allowed, False otherwise
    """
    config = get_server_config()
    
    if config.server_mode == ServerMode.ADMIN:
        return user_role in ADMIN_ALLOWED_ROLES
    else:
        return user_role in USER_ALLOWED_ROLES


def get_role_gate_error_message() -> str:
    """
    Get the appropriate error message for the current server mode.
    
    Returns:
        Error message string
    """
    config = get_server_config()
    
    if config.server_mode == ServerMode.ADMIN:
        return "Access denied: This server is for administrators only"
    return "Access denied: This server is for students and mentors only"


def get_allowed_roles() -> List[str]:
    """
    Get the list of roles allowed on the current server.
    
    Returns:
        List of allowed role strings
    """
    config = get_server_config()
    
    if config.server_mode == ServerMode.ADMIN:
        return ADMIN_ALLOWED_ROLES.copy()
    return USER_ALLOWED_ROLES.copy()


def enforce_role_gate(user_role: str) -> None:
    """
    Enforce the role gate, raising an HTTPException if the role is not allowed.
    
    Args:
        user_role: The role of the user attempting to login
        
    Raises:
        HTTPException: 403 Forbidden if the role is not allowed
    """
    if not validate_role_for_server(user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_role_gate_error_message()
        )
