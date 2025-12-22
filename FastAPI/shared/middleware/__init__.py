"""
Middleware module for shared middleware components.
"""
from .role_gate import (
    ADMIN_ALLOWED_ROLES,
    USER_ALLOWED_ROLES,
    validate_role_for_server,
    get_role_gate_error_message,
    RoleGateError
)

__all__ = [
    'ADMIN_ALLOWED_ROLES',
    'USER_ALLOWED_ROLES',
    'validate_role_for_server',
    'get_role_gate_error_message',
    'RoleGateError'
]
