"""
Unit tests for Edge Agent.
Tests cover:
- Configuration
- Camera adapter
- API client
"""
import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch
import numpy as np

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from edge_agent.config import EdgeAgentConfig
from edge_agent.api_client.client import APIClient, RecognitionResponse


# ==================== Configuration Tests ====================

class TestEdgeAgentConfig:
    """Tests for EdgeAgentConfig."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = EdgeAgentConfig()
        
        assert config.camera_id == 0
        assert config.capture_fps == 2.0
        assert config.max_retries == 3
        assert config.show_preview is True
    
    def test_custom_config(self):
        """Test custom configuration."""
        config = EdgeAgentConfig()
        config.camera_id = 1
        config.capture_fps = 5.0
        config.show_preview = False
        
        assert config.camera_id == 1
        assert config.capture_fps == 5.0
        assert config.show_preview is False


# ==================== Recognition Response Tests ====================

class TestRecognitionResponse:
    """Tests for RecognitionResponse dataclass."""
    
    def test_success_response(self):
        """Test successful recognition response."""
        response = RecognitionResponse(
            success=True,
            recognized=True,
            user_id="user-123",
            confidence=0.95,
            attendance_marked=True,
            status="present"
        )
        
        assert response.success is True
        assert response.recognized is True
        assert response.user_id == "user-123"
        assert response.confidence == 0.95
        assert response.attendance_marked is True
    
    def test_failure_response(self):
        """Test failed recognition response."""
        response = RecognitionResponse(
            success=False,
            message="No face detected"
        )
        
        assert response.success is False
        assert response.recognized is False
        assert response.user_id is None


# ==================== API Client Tests ====================

class TestAPIClient:
    """Tests for APIClient."""
    
    @pytest.fixture
    def api_client(self):
        """Create API client for testing."""
        return APIClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout=5.0,
            max_retries=2
        )
    
    def test_client_initialization(self, api_client):
        """Test client initialization."""
        assert api_client.base_url == "http://localhost:8000"
        assert api_client.api_key == "test-key"
        assert api_client.timeout == 5.0
        assert api_client.max_retries == 2
    
    @patch('requests.Session.request')
    def test_health_check_success(self, mock_request, api_client):
        """Test successful health check."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_request.return_value = mock_response
        
        result = api_client.health_check()
        assert result is True
    
    @patch('requests.Session.request')
    def test_health_check_failure(self, mock_request, api_client):
        """Test failed health check."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_request.return_value = mock_response
        
        result = api_client.health_check()
        assert result is False
    
    @patch('requests.Session.request')
    def test_recognize_face_success(self, mock_request, api_client):
        """Test successful face recognition."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'recognized': True,
            'user_id': 'user-123',
            'confidence': 0.95,
            'message': 'Match found'
        }
        mock_request.return_value = mock_response
        
        # Create test image
        image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        result = api_client.recognize_face(image)
        
        assert result.success is True
        assert result.recognized is True
        assert result.user_id == 'user-123'
        assert result.confidence == 0.95
    
    @patch('requests.Session.request')
    def test_recognize_face_no_match(self, mock_request, api_client):
        """Test face recognition with no match."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'recognized': False,
            'message': 'No match found'
        }
        mock_request.return_value = mock_response
        
        image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        result = api_client.recognize_face(image)
        
        assert result.success is True
        assert result.recognized is False
    
    @patch('requests.Session.request')
    def test_recognize_for_attendance(self, mock_request, api_client):
        """Test recognition with attendance marking."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'recognized': True,
            'user_id': 'user-123',
            'confidence': 0.95,
            'attendance_marked': True,
            'status': 'present'
        }
        mock_request.return_value = mock_response
        
        image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        result = api_client.recognize_for_attendance('session-123', image)
        
        assert result.success is True
        assert result.recognized is True
        assert result.attendance_marked is True
        assert result.status == 'present'
    
    @patch('requests.Session.request')
    def test_request_timeout(self, mock_request, api_client):
        """Test request timeout handling."""
        import requests
        mock_request.side_effect = requests.exceptions.Timeout()
        
        result = api_client.health_check()
        assert result is False


# ==================== Camera Adapter Tests ====================

class TestOpenCVCameraAdapter:
    """Tests for OpenCVCameraAdapter (mocked)."""
    
    @patch('cv2.VideoCapture')
    def test_camera_open_success(self, mock_capture):
        """Test successful camera open."""
        from edge_agent.camera.opencv_adapter import OpenCVCameraAdapter
        
        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        mock_cap.get.return_value = 640
        mock_capture.return_value = mock_cap
        
        adapter = OpenCVCameraAdapter(camera_id=0)
        result = adapter.open()
        
        assert result is True
        assert adapter.is_opened() is True
    
    @patch('cv2.VideoCapture')
    def test_camera_open_failure(self, mock_capture):
        """Test failed camera open."""
        from edge_agent.camera.opencv_adapter import OpenCVCameraAdapter
        
        mock_cap = Mock()
        mock_cap.isOpened.return_value = False
        mock_capture.return_value = mock_cap
        
        adapter = OpenCVCameraAdapter(camera_id=0)
        result = adapter.open()
        
        assert result is False
    
    @patch('cv2.VideoCapture')
    def test_read_frame(self, mock_capture):
        """Test reading frame from camera."""
        from edge_agent.camera.opencv_adapter import OpenCVCameraAdapter
        
        mock_cap = Mock()
        mock_cap.isOpened.return_value = True
        mock_cap.read.return_value = (True, np.zeros((480, 640, 3), dtype=np.uint8))
        mock_capture.return_value = mock_cap
        
        adapter = OpenCVCameraAdapter(camera_id=0)
        adapter.open()
        
        success, frame = adapter.read_frame()
        
        assert success is True
        assert frame is not None
        assert frame.shape == (480, 640, 3)


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
