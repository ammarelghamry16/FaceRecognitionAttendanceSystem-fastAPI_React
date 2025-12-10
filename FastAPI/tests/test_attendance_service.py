"""
Unit tests for Attendance Service.
Tests cover:
- Session state machine
- Session management
- Attendance marking
- Statistics
"""
import pytest
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, MagicMock, patch

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.attendance_service.state_machine import (
    SessionContext, ActiveState, InactiveState, CompletedState
)
from services.attendance_service.models.attendance_session import AttendanceSession
from services.attendance_service.models.attendance_record import AttendanceRecord


# ==================== State Machine Tests ====================

class TestSessionStateMachine:
    """Tests for Session State Machine."""
    
    def test_inactive_state_can_activate(self):
        """Test that inactive state can be activated."""
        state = InactiveState()
        assert state.can_activate() is True
        assert state.can_deactivate() is False
        assert state.can_mark_attendance() is False
    
    def test_active_state_can_deactivate(self):
        """Test that active state can be deactivated."""
        state = ActiveState()
        assert state.can_activate() is False
        assert state.can_deactivate() is True
        assert state.can_mark_attendance() is True
    
    def test_completed_state_is_terminal(self):
        """Test that completed state is terminal."""
        state = CompletedState()
        assert state.can_activate() is False
        assert state.can_deactivate() is False
        assert state.can_mark_attendance() is False
    
    def test_inactive_to_active_transition(self):
        """Test transition from inactive to active."""
        session = Mock()
        session.state = "inactive"
        session.start_time = None
        
        context = SessionContext(session)
        assert context.can_activate() is True
        
        result = context.activate()
        assert result is True
        assert session.state == "active"
    
    def test_active_to_completed_transition(self):
        """Test transition from active to completed."""
        session = Mock()
        session.state = "active"
        session.end_time = None
        
        context = SessionContext(session)
        assert context.can_deactivate() is True
        
        result = context.deactivate()
        assert result is True
        assert session.state == "completed"
        assert session.end_time is not None
    
    def test_cannot_activate_completed_session(self):
        """Test that completed session cannot be activated."""
        session = Mock()
        session.state = "completed"
        
        context = SessionContext(session)
        result = context.activate()
        assert result is False
    
    def test_cancel_active_session(self):
        """Test cancelling an active session."""
        session = Mock()
        session.state = "active"
        session.end_time = None
        
        context = SessionContext(session)
        result = context.cancel()
        assert result is True
        assert session.state == "cancelled"


# ==================== Session Repository Tests ====================

class TestSessionRepository:
    """Tests for SessionRepository with mocked database."""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def session_repo(self, mock_db):
        from services.attendance_service.repositories.session_repository import SessionRepository
        return SessionRepository(mock_db)
    
    def test_find_active_by_class(self, session_repo, mock_db):
        """Test finding active session for a class."""
        class_id = uuid4()
        mock_session = Mock()
        mock_session.class_id = class_id
        mock_session.state = "active"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_session
        
        result = session_repo.find_active_by_class(class_id)
        assert result == mock_session
    
    def test_has_active_session_true(self, session_repo, mock_db):
        """Test has_active_session when session exists."""
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        
        assert session_repo.has_active_session(uuid4()) is True
    
    def test_has_active_session_false(self, session_repo, mock_db):
        """Test has_active_session when no session exists."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        assert session_repo.has_active_session(uuid4()) is False


# ==================== Attendance Repository Tests ====================

class TestAttendanceRepository:
    """Tests for AttendanceRepository with mocked database."""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def attendance_repo(self, mock_db):
        from services.attendance_service.repositories.attendance_repository import AttendanceRepository
        return AttendanceRepository(mock_db)
    
    def test_find_by_session_and_student(self, attendance_repo, mock_db):
        """Test finding record by session and student."""
        session_id = uuid4()
        student_id = uuid4()
        mock_record = Mock()
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_record
        
        result = attendance_repo.find_by_session_and_student(session_id, student_id)
        assert result == mock_record
    
    def test_get_session_stats(self, attendance_repo, mock_db):
        """Test getting session statistics."""
        records = [
            Mock(status="present"),
            Mock(status="present"),
            Mock(status="absent"),
            Mock(status="late"),
        ]
        mock_db.query.return_value.filter.return_value.all.return_value = records
        
        stats = attendance_repo.get_session_stats(uuid4())
        
        assert stats["present"] == 2
        assert stats["absent"] == 1
        assert stats["late"] == 1
        assert stats["total"] == 4


# ==================== Attendance Service Tests ====================

class TestAttendanceService:
    """Tests for AttendanceService with mocked dependencies."""
    
    @pytest.fixture
    def mock_db(self):
        return MagicMock()
    
    @pytest.fixture
    def attendance_service(self, mock_db):
        from services.attendance_service.services.attendance_service import AttendanceService
        return AttendanceService(mock_db)
    
    def test_start_session_success(self, attendance_service, mock_db):
        """Test starting a new session."""
        class_id = uuid4()
        user_id = uuid4()
        
        # Mock no existing active session
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        session = attendance_service.start_session(class_id, user_id)
        
        assert session.class_id == class_id
        assert session.started_by == user_id
        assert session.state == "active"
    
    def test_start_session_already_active(self, attendance_service, mock_db):
        """Test starting session when one already exists."""
        class_id = uuid4()
        
        # Mock existing active session
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        
        with pytest.raises(ValueError, match="already has an active"):
            attendance_service.start_session(class_id, uuid4())
    
    def test_mark_attendance_session_not_found(self, attendance_service, mock_db):
        """Test marking attendance for non-existent session."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Session not found"):
            attendance_service.mark_attendance(uuid4(), uuid4())
    
    def test_mark_attendance_session_not_active(self, attendance_service, mock_db):
        """Test marking attendance for completed session."""
        mock_session = Mock()
        mock_session.state = "completed"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_session
        
        with pytest.raises(ValueError, match="Cannot mark attendance"):
            attendance_service.mark_attendance(uuid4(), uuid4())
    
    def test_get_student_stats(self, attendance_service, mock_db):
        """Test getting student statistics."""
        records = [
            Mock(status="present"),
            Mock(status="present"),
            Mock(status="late"),
            Mock(status="absent"),
        ]
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = records
        
        stats = attendance_service.get_student_stats(uuid4())
        
        assert stats["total_sessions"] == 4
        assert stats["present"] == 2
        assert stats["late"] == 1
        assert stats["absent"] == 1
        assert stats["attendance_rate"] == 0.75  # (2+1)/4


# ==================== Model Tests ====================

class TestAttendanceSessionModel:
    """Tests for AttendanceSession model."""
    
    def test_is_active(self):
        """Test is_active method."""
        session = AttendanceSession()
        session.state = "active"
        assert session.is_active() is True
        
        session.state = "completed"
        assert session.is_active() is False
    
    def test_can_mark_attendance(self):
        """Test can_mark_attendance method."""
        session = AttendanceSession()
        session.state = "active"
        assert session.can_mark_attendance() is True
        
        session.state = "completed"
        assert session.can_mark_attendance() is False
    
    def test_get_duration_minutes(self):
        """Test duration calculation."""
        session = AttendanceSession()
        session.start_time = datetime.now(timezone.utc) - timedelta(minutes=30)
        session.end_time = datetime.now(timezone.utc)
        
        duration = session.get_duration_minutes()
        assert 29 <= duration <= 31  # Allow small variance


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
