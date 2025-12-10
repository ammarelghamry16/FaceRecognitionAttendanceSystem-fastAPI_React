"""
Password Service for secure password hashing using bcrypt.
"""
import bcrypt
import secrets
import hashlib


class PasswordService:
    """
    Service for password hashing and verification using bcrypt.
    Also handles API key generation and hashing.
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password string
        """
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.
        
        Args:
            password: Plain text password to verify
            hashed_password: Stored password hash
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except Exception:
            return False
    
    @staticmethod
    def generate_api_key() -> str:
        """
        Generate a secure random API key.
        
        Returns:
            Random API key string (32 bytes hex = 64 characters)
        """
        return secrets.token_hex(32)
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """
        Hash an API key using SHA-256.
        
        We use SHA-256 instead of bcrypt for API keys because:
        1. API keys are already high-entropy random strings
        2. We need fast lookups for every request
        3. bcrypt's slowness is designed for low-entropy passwords
        
        Args:
            api_key: Plain text API key
            
        Returns:
            SHA-256 hash of the API key
        """
        return hashlib.sha256(api_key.encode('utf-8')).hexdigest()
    
    @staticmethod
    def verify_api_key(api_key: str, key_hash: str) -> bool:
        """
        Verify an API key against its hash.
        
        Args:
            api_key: Plain text API key
            key_hash: Stored key hash
            
        Returns:
            True if key matches, False otherwise
        """
        return PasswordService.hash_api_key(api_key) == key_hash
