"""
Unit tests for AI Service.
Tests cover:
- Face recognition adapter
- Recognition service
- Enrollment and matching logic
"""
import pytest
import sys
from pathlib import Path
from uuid import uuid4
from unittest.mock import Mock, MagicMock, patch
import numpy as np

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ai_service.adapters.base_adapter import (
    IFaceRecognitionAdapter,
    FaceDetectionResult,
    RecognitionResult
)


# ==================== Base Adapter Tests ====================

class TestFaceDetectionResult:
    """Tests for FaceDetectionResult dataclass."""
    
    def test_empty_result(self):
        """Test empty detection result."""
        result = FaceDetectionResult(face_count=0)
        assert result.face_count == 0
        assert result.face_locations == []
        assert result.embeddings == []
    
    def test_result_with_faces(self):
        """Test detection result with faces."""
        embedding = np.random.rand(512).astype(np.float32)
        result = FaceDetectionResult(
            face_count=1,
            face_locations=[(10, 100, 110, 10)],
            confidence_scores=[0.99],
            embeddings=[embedding]
        )
        assert result.face_count == 1
        assert len(result.embeddings) == 1


class TestRecognitionResult:
    """Tests for RecognitionResult dataclass."""
    
    def test_matched_result(self):
        """Test matched recognition result."""
        result = RecognitionResult(
            matched=True,
            user_id="user-123",
            confidence=0.95,
            distance=0.2
        )
        assert result.matched is True
        assert result.user_id == "user-123"
        assert result.confidence == 0.95
    
    def test_unmatched_result(self):
        """Test unmatched recognition result."""
        result = RecognitionResult(
            matched=False,
            message="No match found"
        )
        assert result.matched is False
        assert result.user_id is None


# ==================== Mock Adapter for Testing ====================

class MockFaceAdapter(IFaceRecognitionAdapter):
    """Mock adapter for testing without InsightFace."""
    
    @property
    def name(self) -> str:
        return "mock_adapter_v1"
    
    @property
    def embedding_size(self) -> int:
        return 512
    
    def detect_faces(self, image: np.ndarray) -> FaceDetectionResult:
        # Return a fake detection
        embedding = np.random.rand(512).astype(np.float32)
        embedding = embedding / np.linalg.norm(embedding)
        return FaceDetectionResult(
            face_count=1,
            face_locations=[(10, 100, 110, 10)],
            confidence_scores=[0.99],
            embeddings=[embedding]
        )
    
    def get_embedding(self, image: np.ndarray):
        result = self.detect_faces(image)
        return result.embeddings[0] if result.face_count > 0 else None
    
    def compare_embeddings(self, e1: np.ndarray, e2: np.ndarray) -> float:
        e1 = np.array(e1, dtype=np.float32)
        e2 = np.array(e2, dtype=np.float32)
        e1 = e1 / (np.linalg.norm(e1) + 1e-10)
        e2 = e2 / (np.linalg.norm(e2) + 1e-10)
        return float(1.0 - np.dot(e1, e2))


class TestMockAdapter:
    """Tests for mock adapter functionality."""
    
    @pytest.fixture
    def adapter(self):
        return MockFaceAdapter()
    
    def test_adapter_name(self, adapter):
        """Test adapter name."""
        assert adapter.name == "mock_adapter_v1"
    
    def test_embedding_size(self, adapter):
        """Test embedding size."""
        assert adapter.embedding_size == 512
    
    def test_detect_faces(self, adapter):
        """Test face detection."""
        image = np.random.rand(224, 224, 3).astype(np.uint8)
        result = adapter.detect_faces(image)
        
        assert result.face_count == 1
        assert len(result.embeddings) == 1
        assert result.embeddings[0].shape == (512,)
    
    def test_compare_same_embedding(self, adapter):
        """Test comparing identical embeddings."""
        emb = np.random.rand(512).astype(np.float32)
        emb = emb / np.linalg.norm(emb)
        
        distance = adapter.compare_embeddings(emb, emb)
        assert distance < 0.01  # Should be ~0
    
    def test_compare_different_embeddings(self, adapter):
        """Test comparing different embeddings."""
        emb1 = np.random.rand(512).astype(np.float32)
        emb2 = np.random.rand(512).astype(np.float32)
        
        distance = adapter.compare_embeddings(emb1, emb2)
        assert 0 <= distance <= 2  # Cosine distance range
    
    def test_match_face_found(self, adapter):
        """Test face matching when match exists."""
        query = np.random.rand(512).astype(np.float32)
        query = query / np.linalg.norm(query)
        
        # Create known embeddings with one matching
        known = [
            ("user-1", np.random.rand(512).astype(np.float32)),
            ("user-2", query.copy()),  # Same as query
            ("user-3", np.random.rand(512).astype(np.float32)),
        ]
        
        result = adapter.match_face(query, known, threshold=0.6)
        
        assert result.matched is True
        assert result.user_id == "user-2"
    
    def test_match_face_not_found(self, adapter):
        """Test face matching when no match exists."""
        query = np.random.rand(512).astype(np.float32)
        
        # Create known embeddings with no match
        known = [
            ("user-1", np.random.rand(512).astype(np.float32)),
            ("user-2", np.random.rand(512).astype(np.float32)),
        ]
        
        result = adapter.match_face(query, known, threshold=0.1)  # Very strict
        
        assert result.matched is False
    
    def test_match_face_empty_known(self, adapter):
        """Test face matching with no known faces."""
        query = np.random.rand(512).astype(np.float32)
        
        result = adapter.match_face(query, [], threshold=0.6)
        
        assert result.matched is False
        assert "No known faces" in result.message


# ==================== Recognition Service Tests ====================

class TestRecognitionService:
    """Tests for RecognitionService with mocked dependencies."""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def mock_adapter(self):
        return MockFaceAdapter()
    
    @pytest.fixture
    def recognition_service(self, mock_db, mock_adapter):
        from services.ai_service.services.recognition_service import RecognitionService
        service = RecognitionService(mock_db, adapter=mock_adapter)
        return service
    
    def test_is_user_enrolled_true(self, recognition_service, mock_db):
        """Test checking if user is enrolled."""
        mock_db.query.return_value.filter.return_value.count.return_value = 3
        
        assert recognition_service.is_user_enrolled(uuid4()) is True
    
    def test_is_user_enrolled_false(self, recognition_service, mock_db):
        """Test checking if user is not enrolled."""
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        
        assert recognition_service.is_user_enrolled(uuid4()) is False
    
    def test_get_user_encodings_count(self, recognition_service, mock_db):
        """Test getting encoding count."""
        mock_db.query.return_value.filter.return_value.count.return_value = 5
        
        count = recognition_service.get_user_encodings_count(uuid4())
        assert count == 5


# ==================== Face Encoding Repository Tests ====================

class TestFaceEncodingRepository:
    """Tests for FaceEncodingRepository."""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def repo(self, mock_db):
        from services.ai_service.repositories.face_encoding_repository import FaceEncodingRepository
        return FaceEncodingRepository(mock_db)
    
    def test_find_by_user(self, repo, mock_db):
        """Test finding encodings by user."""
        user_id = uuid4()
        mock_encodings = [Mock(), Mock()]
        mock_db.query.return_value.filter.return_value.all.return_value = mock_encodings
        
        result = repo.find_by_user(user_id)
        assert len(result) == 2
    
    def test_count_by_user(self, repo, mock_db):
        """Test counting encodings by user."""
        mock_db.query.return_value.filter.return_value.count.return_value = 3
        
        count = repo.count_by_user(uuid4())
        assert count == 3
    
    def test_user_has_encodings_true(self, repo, mock_db):
        """Test user has encodings."""
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        assert repo.user_has_encodings(uuid4()) is True
    
    def test_user_has_encodings_false(self, repo, mock_db):
        """Test user has no encodings."""
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        
        assert repo.user_has_encodings(uuid4()) is False


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
