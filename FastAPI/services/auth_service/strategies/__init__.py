"""
Auth Strategies implementing Strategy pattern.
"""
from .auth_strategy import IAuthStrategy, AuthResult
from .jwt_strategy import JWTAuthStrategy
from .api_key_strategy import APIKeyAuthStrategy

__all__ = ["IAuthStrategy", "AuthResult", "JWTAuthStrategy", "APIKeyAuthStrategy"]
