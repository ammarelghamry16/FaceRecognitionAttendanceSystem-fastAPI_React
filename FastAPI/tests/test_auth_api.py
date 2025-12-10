"""
API endpoint tests for Auth Service.
Tests the REST API endpoints using FastAPI TestClient.
"""
import pytest
import sys
from pathlib import Path
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from fastapi import FastAPI

# Create test app
from services.auth_service.api.routes import router as auth_router
from services.auth_service.services.password_service import PasswordService

app = FastAPI()
app.include_router(auth_router, prefix="/api/auth")


# ==================== Fixtures ====================

@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Create a mock user object."""
    user = Mock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.role = "student"
    user.student_id = "STU001"
    user.is_active = True
    user.password_hash = PasswordService.hash_password("Password123")
    user.created_at = "2024-01-01T00:00:00Z"
    user.updated_at = "2024-01-01T00:00:00Z"
    return user


@pytest.fixture
def mock_admin_user():
    """Create a mock admin user object."""
    user = Mock()
    user.id = uuid4()
    user.email = "admin@example.com"
    user.full_name = "Admin User"
    user.role = "admin"
    user.student_id = None
    user.is_active = True
    user.password_hash = PasswordService.hash_password("AdminPass123")
    user.created_at = "2024-01-01T00:00:00Z"
    user.updated_at = "2024-01-01T00:00:00Z"
    return user


# ==================== Login Tests ====================

class TestLoginEndpoint:
    """Tests for POST /api/auth/login endpoint."""
    
    def test_login_missing_email(self, client):
        """Test login with missing email."""
        response = client.post("/api/auth/login", json={
            "password": "Password123"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_login_missing_password(self, client):
        """Test login with missing password."""
        response = client.post("/api/auth/login", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format."""
        response = client.post("/api/auth/login", json={
            "email": "not-an-email",
            "password": "Password123"
        })
        
        assert response.status_code == 422  # Validation error
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_login_user_not_found(self, mock_auth_service_class, client):
        """Test login when user doesn't exist."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.login.return_value = AuthResult.failure_result("Invalid email or password")
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "Password123"
        })
        
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_login_success(self, mock_auth_service_class, client, mock_user):
        """Test successful login."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.login.return_value = AuthResult.success_result(
            user_id=mock_user.id,
            email=mock_user.email,
            role=mock_user.role,
            additional_data={
                "access_token": "test_access_token",
                "refresh_token": "test_refresh_token",
                "full_name": mock_user.full_name,
                "token_type": "bearer"
            }
        )
        mock_service.get_user_by_id.return_value = mock_user
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data


# ==================== Register Tests ====================

class TestRegisterEndpoint:
    """Tests for POST /api/auth/register endpoint."""
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 422
    
    def test_register_weak_password(self, client):
        """Test registration with weak password."""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "weak",  # Too short, no uppercase, no digit
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_register_password_no_uppercase(self, client):
        """Test registration with password missing uppercase."""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "password123",  # No uppercase
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_register_password_no_digit(self, client):
        """Test registration with password missing digit."""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "PasswordABC",  # No digit
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role."""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "Password123",
            "full_name": "Test User",
            "role": "superuser"  # Invalid role
        })
        
        assert response.status_code == 422
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_register_email_exists(self, mock_auth_service_class, client):
        """Test registration when email already exists."""
        mock_service = Mock()
        mock_service.register_user.side_effect = ValueError("Email 'test@example.com' is already registered")
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "Password123",
            "full_name": "Test User"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_register_success(self, mock_auth_service_class, client, mock_user):
        """Test successful registration."""
        mock_service = Mock()
        mock_service.register_user.return_value = mock_user
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "Password123",
            "full_name": "Test User",
            "role": "student"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "student"


# ==================== Refresh Token Tests ====================

class TestRefreshEndpoint:
    """Tests for POST /api/auth/refresh endpoint."""
    
    def test_refresh_missing_token(self, client):
        """Test refresh with missing token."""
        response = client.post("/api/auth/refresh", json={})
        
        assert response.status_code == 422
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_refresh_invalid_token(self, mock_auth_service_class, client):
        """Test refresh with invalid token."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.refresh_tokens.return_value = AuthResult.failure_result("Invalid refresh token")
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "invalid_token"
        })
        
        assert response.status_code == 401
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_refresh_success(self, mock_auth_service_class, client, mock_user):
        """Test successful token refresh."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.refresh_tokens.return_value = AuthResult.success_result(
            user_id=mock_user.id,
            email=mock_user.email,
            role=mock_user.role,
            additional_data={
                "access_token": "new_access_token",
                "refresh_token": "new_refresh_token",
                "full_name": mock_user.full_name,
                "token_type": "bearer"
            }
        )
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/refresh", json={
            "refresh_token": "valid_refresh_token"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "new_access_token"
        assert data["refresh_token"] == "new_refresh_token"


# ==================== Validate Token Tests ====================

class TestValidateEndpoint:
    """Tests for POST /api/auth/validate endpoint."""
    
    def test_validate_no_token(self, client):
        """Test validate without token."""
        response = client.post("/api/auth/validate")
        
        assert response.status_code == 401
    
    def test_validate_invalid_token(self, client):
        """Test validate with invalid token."""
        response = client.post(
            "/api/auth/validate",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401


# ==================== API Key Tests ====================

class TestAPIKeyEndpoints:
    """Tests for API key management endpoints."""
    
    def test_create_api_key_no_auth(self, client):
        """Test creating API key without authentication."""
        response = client.post("/api/auth/api-keys", json={
            "edge_agent_id": "agent-001",
            "description": "Test Agent"
        })
        
        assert response.status_code == 401
    
    def test_get_api_keys_no_auth(self, client):
        """Test getting API keys without authentication."""
        response = client.get("/api/auth/api-keys")
        
        assert response.status_code == 401
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_validate_api_key_invalid(self, mock_auth_service_class, client):
        """Test validating invalid API key."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.validate_api_key.return_value = AuthResult.failure_result("Invalid API key")
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/api-keys/validate?api_key=invalid_key")
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
    
    @patch('services.auth_service.api.routes.AuthService')
    def test_validate_api_key_success(self, mock_auth_service_class, client):
        """Test validating valid API key."""
        from services.auth_service.strategies.auth_strategy import AuthResult
        
        mock_service = Mock()
        mock_service.validate_api_key.return_value = AuthResult.success_result(
            user_id=uuid4(),
            email=None,
            role="edge_agent",
            additional_data={
                "edge_agent_id": "agent-001",
                "description": "Test Agent"
            }
        )
        mock_auth_service_class.return_value = mock_service
        
        response = client.post("/api/auth/api-keys/validate?api_key=valid_key")
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["edge_agent_id"] == "agent-001"


# ==================== Change Password Tests ====================

class TestChangePasswordEndpoint:
    """Tests for POST /api/auth/me/change-password endpoint."""
    
    def test_change_password_no_auth(self, client):
        """Test changing password without authentication."""
        response = client.post("/api/auth/me/change-password", json={
            "old_password": "OldPassword123",
            "new_password": "NewPassword123"
        })
        
        assert response.status_code == 401
    
    def test_change_password_weak_new_password(self, client):
        """Test changing password with weak new password."""
        # This will fail at validation before auth check
        response = client.post("/api/auth/me/change-password", json={
            "old_password": "OldPassword123",
            "new_password": "weak"
        })
        
        assert response.status_code in [401, 422]  # Either auth or validation error


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
