"""
Tests for Stats Service.
"""
import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from services.stats_service.services.stats_service import StatsService


class TestStatsService:
    """Test cases for StatsService."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def stats_service(self, mock_db):
        """Create a StatsService instance with mock db."""
        return StatsService(mock_db)
    
    def test_get_dashboard_stats_empty_db(self, stats_service, mock_db):
        """Test dashboard stats with empty database."""
        # Mock all queries to return 0
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.scalar.return_value = 0
        mock_db.query.return_value = mock_query
        
        stats = stats_service.get_dashboard_stats()
        
        assert stats["total_courses"] == 0
        assert stats["total_classes"] == 0
        assert stats["total_students"] == 0
        assert stats["total_mentors"] == 0
        assert stats["total_admins"] == 0
        assert stats["active_sessions"] == 0
        assert stats["overall_attendance_rate"] == 0.0
    
    def test_get_student_stats_no_records(self, stats_service, mock_db):
        """Test student stats with no attendance records."""
        student_id = uuid4()
        
        # Mock query to return empty list
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = []
        mock_db.query.return_value = mock_query
        
        stats = stats_service.get_student_stats(student_id)
        
        assert stats["student_id"] == str(student_id)
        assert stats["total_sessions"] == 0
        assert stats["present"] == 0
        assert stats["late"] == 0
        assert stats["absent"] == 0
        assert stats["excused"] == 0
        assert stats["attendance_rate"] == 0.0
    
    def test_get_student_stats_with_records(self, stats_service, mock_db):
        """Test student stats with attendance records."""
        student_id = uuid4()
        
        # Create mock records
        mock_records = [
            MagicMock(status='present'),
            MagicMock(status='present'),
            MagicMock(status='late'),
            MagicMock(status='absent'),
            MagicMock(status='excused'),
        ]
        
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = mock_records
        mock_db.query.return_value = mock_query
        
        stats = stats_service.get_student_stats(student_id)
        
        assert stats["total_sessions"] == 5
        assert stats["present"] == 2
        assert stats["late"] == 1
        assert stats["absent"] == 1
        assert stats["excused"] == 1
        # Attendance rate = (2 present + 1 late) / 5 total = 60%
        assert stats["attendance_rate"] == 60.0
    
    def test_get_class_stats_not_found(self, stats_service, mock_db):
        """Test class stats when class doesn't exist."""
        class_id = uuid4()
        
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query
        
        stats = stats_service.get_class_stats(class_id)
        
        assert stats is None
    
    def test_get_user_count(self, stats_service, mock_db):
        """Test user count by role."""
        # Mock different counts for each role
        call_count = [0]
        
        def mock_scalar():
            call_count[0] += 1
            if call_count[0] == 1:
                return 20  # students
            elif call_count[0] == 2:
                return 5   # mentors
            else:
                return 2   # admins
        
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.scalar.side_effect = mock_scalar
        mock_db.query.return_value = mock_query
        
        counts = stats_service.get_user_count()
        
        assert counts["students"] == 20
        assert counts["mentors"] == 5
        assert counts["admins"] == 2
        assert counts["total"] == 27


class TestStatsServiceIntegration:
    """Integration tests for Stats Service (requires database)."""
    
    @pytest.fixture
    def db_session(self):
        """Get a real database session for integration tests."""
        from shared.database.connection import get_db_session
        db = next(get_db_session())
        yield db
        db.close()
    
    @pytest.mark.integration
    def test_dashboard_stats_integration(self, db_session):
        """Test dashboard stats with real database."""
        service = StatsService(db_session)
        stats = service.get_dashboard_stats()
        
        # Just verify the structure is correct
        assert "total_courses" in stats
        assert "total_classes" in stats
        assert "total_students" in stats
        assert "total_mentors" in stats
        assert "total_admins" in stats
        assert "active_sessions" in stats
        assert "overall_attendance_rate" in stats
        assert "today_sessions" in stats
        assert "today_attendance_count" in stats
        
        # All values should be non-negative
        assert stats["total_courses"] >= 0
        assert stats["total_classes"] >= 0
        assert stats["total_students"] >= 0
        assert stats["overall_attendance_rate"] >= 0
    
    @pytest.mark.integration
    def test_user_count_integration(self, db_session):
        """Test user count with real database."""
        service = StatsService(db_session)
        counts = service.get_user_count()
        
        assert "total" in counts
        assert "students" in counts
        assert "mentors" in counts
        assert "admins" in counts
        
        # Total should equal sum of roles
        assert counts["total"] == counts["students"] + counts["mentors"] + counts["admins"]
