"""
Unit tests for Auth Service.
Tests cover:
- Password hashing and verification
- JWT token generation and validation
- User registration and login
- API key management
- Authentication strategies
"""
import pytest
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, MagicMock, patch

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.auth_service.services.password_service import PasswordService
from services.auth_service.services.token_service import TokenService
from services.auth_service.strategies.auth_strategy import AuthResult


# ==================== Password Service Tests ====================

class TestPasswordService:
    """Tests for PasswordService."""
    
    def test_hash_password_returns_hash(self):
        """Test that hash_password returns a bcrypt hash."""
        password = "TestPassword123"
        hashed = PasswordService.hash_password(password)
        
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt prefix
    
    def test_hash_password_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (due to salt)."""
        password = "TestPassword123"
        hash1 = PasswordService.hash_password(password)
        hash2 = PasswordService.hash_password(password)
        
        assert hash1 != hash2  # Different salts
    
    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "TestPassword123"
        hashed = PasswordService.hash_password(password)
        
        assert PasswordService.verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "TestPassword123"
        wrong_password = "WrongPassword456"
        hashed = PasswordService.hash_password(password)
        
        assert PasswordService.verify_password(wrong_password, hashed) is False
    
    def test_verify_password_empty_password(self):
        """Test password verification with empty password."""
        password = "TestPassword123"
        hashed = PasswordService.hash_password(password)
        
        assert PasswordService.verify_password("", hashed) is False
    
    def test_verify_password_invalid_hash(self):
        """Test password verification with invalid hash."""
        assert PasswordService.verify_password("password", "invalid_hash") is False
    
    def test_generate_api_key_length(self):
        """Test that generated API key has correct length."""
        api_key = PasswordService.generate_api_key()
        
        assert len(api_key) == 64  # 32 bytes hex = 64 characters
    
    def test_generate_api_key_unique(self):
        """Test that generated API keys are unique."""
        keys = [PasswordService.generate_api_key() for _ in range(100)]
        
        assert len(set(keys)) == 100  # All unique
    
    def test_hash_api_key_consistent(self):
        """Test that API key hashing is consistent."""
        api_key = "test_api_key_12345"
        hash1 = PasswordService.hash_api_key(api_key)
        hash2 = PasswordService.hash_api_key(api_key)
        
        assert hash1 == hash2  # SHA-256 is deterministic
    
    def test_verify_api_key_correct(self):
        """Test API key verification with correct key."""
        api_key = PasswordService.generate_api_key()
        key_hash = PasswordService.hash_api_key(api_key)
        
        assert PasswordService.verify_api_key(api_key, key_hash) is True
    
    def test_verify_api_key_incorrect(self):
        """Test API key verification with incorrect key."""
        api_key = PasswordService.generate_api_key()
        key_hash = PasswordService.hash_api_key(api_key)
        wrong_key = PasswordService.generate_api_key()
        
        assert PasswordService.verify_api_key(wrong_key, key_hash) is False


# ==================== Token Service Tests ====================

class TestTokenService:
    """Tests for TokenService."""
    
    @pytest.fixture
    def token_service(self):
        """Create TokenService instance with test config."""
        with patch.dict('os.environ', {
            'JWT_SECRET_KEY': 'test-secret-key-for-testing',
            'JWT_ALGORITHM': 'HS256',
            'JWT_ACCESS_TOKEN_EXPIRE_MINUTES': '30',
            'JWT_REFRESH_TOKEN_EXPIRE_DAYS': '7'
        }):
            return TokenService()
    
    def test_create_access_token(self, token_service):
        """Test access token creation."""
        user_id = uuid4()
        email = "test@example.com"
        role = "student"
        
        token = token_service.create_access_token(user_id, email, role)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_refresh_token(self, token_service):
        """Test refresh token creation."""
        user_id = uuid4()
        
        token = token_service.create_refresh_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
    
    def test_create_token_pair(self, token_service):
        """Test token pair creation."""
        user_id = uuid4()
        email = "test@example.com"
        role = "mentor"
        
        tokens = token_service.create_token_pair(user_id, email, role)
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["access_token"] != tokens["refresh_token"]
    
    def test_verify_access_token_valid(self, token_service):
        """Test verification of valid access token."""
        user_id = uuid4()
        email = "test@example.com"
        role = "admin"
        
        token = token_service.create_access_token(user_id, email, role)
        payload = token_service.verify_access_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["email"] == email
        assert payload["role"] == role
        assert payload["type"] == "access"
    
    def test_verify_refresh_token_valid(self, token_service):
        """Test verification of valid refresh token."""
        user_id = uuid4()
        
        token = token_service.create_refresh_token(user_id)
        payload = token_service.verify_refresh_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"
    
    def test_verify_access_token_with_refresh_token_fails(self, token_service):
        """Test that refresh token fails access token verification."""
        user_id = uuid4()
        
        refresh_token = token_service.create_refresh_token(user_id)
        payload = token_service.verify_access_token(refresh_token)
        
        assert payload is None
    
    def test_verify_refresh_token_with_access_token_fails(self, token_service):
        """Test that access token fails refresh token verification."""
        user_id = uuid4()
        
        access_token = token_service.create_access_token(user_id, "test@test.com", "student")
        payload = token_service.verify_refresh_token(access_token)
        
        assert payload is None
    
    def test_verify_token_invalid(self, token_service):
        """Test verification of invalid token."""
        payload = token_service.verify_token("invalid.token.here")
        
        assert payload is None
    
    def test_verify_token_tampered(self, token_service):
        """Test verification of tampered token."""
        user_id = uuid4()
        token = token_service.create_access_token(user_id, "test@test.com", "student")
        
        # Tamper with the token
        tampered_token = token[:-5] + "xxxxx"
        payload = token_service.verify_token(tampered_token)
        
        assert payload is None
    
    def test_get_user_id_from_token(self, token_service):
        """Test extracting user ID from token."""
        user_id = uuid4()
        token = token_service.create_access_token(user_id, "test@test.com", "student")
        
        extracted_id = token_service.get_user_id_from_token(token)
        
        assert extracted_id == user_id
    
    def test_get_user_id_from_invalid_token(self, token_service):
        """Test extracting user ID from invalid token."""
        extracted_id = token_service.get_user_id_from_token("invalid.token")
        
        assert extracted_id is None
    
    def test_is_token_expired_valid_token(self, token_service):
        """Test is_token_expired with valid token."""
        user_id = uuid4()
        token = token_service.create_access_token(user_id, "test@test.com", "student")
        
        assert token_service.is_token_expired(token) is False
    
    def test_is_token_expired_invalid_token(self, token_service):
        """Test is_token_expired with invalid token."""
        assert token_service.is_token_expired("invalid.token") is True


# ==================== AuthResult Tests ====================

class TestAuthResult:
    """Tests for AuthResult dataclass."""
    
    def test_success_result(self):
        """Test creating successful auth result."""
        user_id = uuid4()
        result = AuthResult.success_result(
            user_id=user_id,
            email="test@example.com",
            role="student",
            additional_data={"token": "abc123"}
        )
        
        assert result.success is True
        assert result.user_id == user_id
        assert result.email == "test@example.com"
        assert result.role == "student"
        assert result.additional_data == {"token": "abc123"}
        assert result.error_message is None
    
    def test_failure_result(self):
        """Test creating failed auth result."""
        result = AuthResult.failure_result("Invalid credentials")
        
        assert result.success is False
        assert result.error_message == "Invalid credentials"
        assert result.user_id is None
        assert result.email is None
        assert result.role is None


# ==================== Integration Tests with Mocked DB ====================

class TestUserRepository:
    """Tests for UserRepository with mocked database."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def user_repo(self, mock_db):
        """Create UserRepository with mock db."""
        from services.auth_service.repositories.user_repository import UserRepository
        return UserRepository(mock_db)
    
    def test_find_by_email_found(self, user_repo, mock_db):
        """Test finding user by email when user exists."""
        mock_user = Mock()
        mock_user.email = "test@example.com"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = user_repo.find_by_email("test@example.com")
        
        assert result == mock_user
    
    def test_find_by_email_not_found(self, user_repo, mock_db):
        """Test finding user by email when user doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = user_repo.find_by_email("nonexistent@example.com")
        
        assert result is None
    
    def test_email_exists_true(self, user_repo, mock_db):
        """Test email_exists when email exists."""
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        
        assert user_repo.email_exists("test@example.com") is True
    
    def test_email_exists_false(self, user_repo, mock_db):
        """Test email_exists when email doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        assert user_repo.email_exists("test@example.com") is False


class TestAPIKeyRepository:
    """Tests for APIKeyRepository with mocked database."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def api_key_repo(self, mock_db):
        """Create APIKeyRepository with mock db."""
        from services.auth_service.repositories.api_key_repository import APIKeyRepository
        return APIKeyRepository(mock_db)
    
    def test_find_by_key_hash_found(self, api_key_repo, mock_db):
        """Test finding API key by hash when it exists."""
        mock_key = Mock()
        mock_key.key_hash = "test_hash"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_key
        
        result = api_key_repo.find_by_key_hash("test_hash")
        
        assert result == mock_key
    
    def test_find_by_key_hash_not_found(self, api_key_repo, mock_db):
        """Test finding API key by hash when it doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = api_key_repo.find_by_key_hash("nonexistent_hash")
        
        assert result is None


# ==================== JWT Strategy Tests ====================

class TestJWTAuthStrategy:
    """Tests for JWTAuthStrategy with mocked dependencies."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def jwt_strategy(self, mock_db):
        """Create JWTAuthStrategy with mock db."""
        with patch.dict('os.environ', {
            'JWT_SECRET_KEY': 'test-secret-key',
            'JWT_ALGORITHM': 'HS256',
            'JWT_ACCESS_TOKEN_EXPIRE_MINUTES': '30',
            'JWT_REFRESH_TOKEN_EXPIRE_DAYS': '7'
        }):
            from services.auth_service.strategies.jwt_strategy import JWTAuthStrategy
            return JWTAuthStrategy(mock_db)
    
    def test_authenticate_missing_email(self, jwt_strategy):
        """Test authentication with missing email."""
        result = jwt_strategy.authenticate({"password": "test123"})
        
        assert result.success is False
        assert "required" in result.error_message.lower()
    
    def test_authenticate_missing_password(self, jwt_strategy):
        """Test authentication with missing password."""
        result = jwt_strategy.authenticate({"email": "test@test.com"})
        
        assert result.success is False
        assert "required" in result.error_message.lower()
    
    def test_authenticate_user_not_found(self, jwt_strategy, mock_db):
        """Test authentication when user doesn't exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = jwt_strategy.authenticate({
            "email": "nonexistent@test.com",
            "password": "password123"
        })
        
        assert result.success is False
        assert "invalid" in result.error_message.lower()
    
    def test_authenticate_inactive_user(self, jwt_strategy, mock_db):
        """Test authentication with inactive user."""
        mock_user = Mock()
        mock_user.is_active = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = jwt_strategy.authenticate({
            "email": "inactive@test.com",
            "password": "password123"
        })
        
        assert result.success is False
        assert "deactivated" in result.error_message.lower()
    
    def test_authenticate_wrong_password(self, jwt_strategy, mock_db):
        """Test authentication with wrong password."""
        mock_user = Mock()
        mock_user.is_active = True
        mock_user.password_hash = PasswordService.hash_password("correct_password")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = jwt_strategy.authenticate({
            "email": "test@test.com",
            "password": "wrong_password"
        })
        
        assert result.success is False
        assert "invalid" in result.error_message.lower()
    
    def test_authenticate_success(self, jwt_strategy, mock_db):
        """Test successful authentication."""
        user_id = uuid4()
        mock_user = Mock()
        mock_user.id = user_id
        mock_user.email = "test@test.com"
        mock_user.role = "student"
        mock_user.full_name = "Test User"
        mock_user.is_active = True
        mock_user.password_hash = PasswordService.hash_password("correct_password")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = jwt_strategy.authenticate({
            "email": "test@test.com",
            "password": "correct_password"
        })
        
        assert result.success is True
        assert result.user_id == user_id
        assert result.email == "test@test.com"
        assert result.role == "student"
        assert "access_token" in result.additional_data
        assert "refresh_token" in result.additional_data


# ==================== API Key Strategy Tests ====================

class TestAPIKeyAuthStrategy:
    """Tests for APIKeyAuthStrategy with mocked dependencies."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def api_key_strategy(self, mock_db):
        """Create APIKeyAuthStrategy with mock db."""
        from services.auth_service.strategies.api_key_strategy import APIKeyAuthStrategy
        return APIKeyAuthStrategy(mock_db)
    
    def test_authenticate_missing_api_key(self, api_key_strategy):
        """Test authentication with missing API key."""
        result = api_key_strategy.authenticate({})
        
        assert result.success is False
        assert "required" in result.error_message.lower()
    
    def test_validate_invalid_key(self, api_key_strategy, mock_db):
        """Test validation with invalid API key."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = api_key_strategy.validate("invalid_api_key")
        
        assert result.success is False
        assert "invalid" in result.error_message.lower()
    
    def test_validate_inactive_key(self, api_key_strategy, mock_db):
        """Test validation with inactive API key."""
        api_key = PasswordService.generate_api_key()
        key_hash = PasswordService.hash_api_key(api_key)
        
        mock_key = Mock()
        mock_key.key_hash = key_hash
        mock_key.is_active = False
        mock_key.is_valid.return_value = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_key
        
        result = api_key_strategy.validate(api_key)
        
        assert result.success is False
    
    def test_validate_success(self, api_key_strategy, mock_db):
        """Test successful API key validation."""
        api_key = PasswordService.generate_api_key()
        key_hash = PasswordService.hash_api_key(api_key)
        key_id = uuid4()
        
        mock_key = Mock()
        mock_key.id = key_id
        mock_key.key_hash = key_hash
        mock_key.edge_agent_id = "agent-001"
        mock_key.description = "Test Agent"
        mock_key.is_active = True
        mock_key.is_valid.return_value = True
        mock_db.query.return_value.filter.return_value.first.return_value = mock_key
        
        result = api_key_strategy.validate(api_key)
        
        assert result.success is True
        assert result.role == "edge_agent"
        assert result.additional_data["edge_agent_id"] == "agent-001"


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
