"""
Tests for Notification Service.

Run with: pytest tests/test_notification_service.py -v
"""
import sys
from pathlib import Path

# Add FastAPI directory to path
fastapi_dir = str(Path(__file__).parent.parent.parent / "FastAPI")
if fastapi_dir not in sys.path:
    sys.path.insert(0, fastapi_dir)

import pytest
from uuid import uuid4, UUID
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock, patch
from sqlalchemy.orm import Session

# Import components to test
from services.notification_service.models.notification import Notification
from services.notification_service.factory.notification_factory import NotificationFactory
from services.notification_service.repositories.notification_repository import NotificationRepository
from services.notification_service.services.notification_service import NotificationService
from services.notification_service.observer.subject import NotificationSubject
from services.notification_service.observer.observer import INotificationObserver
from services.notification_service.observer.websocket_observer import WebSocketObserver


# ==================== Fixtures ====================

@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    session = MagicMock(spec=Session)
    session.add = MagicMock()
    session.flush = MagicMock()
    session.refresh = MagicMock()
    session.query = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def sample_user_id():
    """Generate a sample user ID."""
    return uuid4()


@pytest.fixture
def sample_notification(sample_user_id):
    """Create a sample notification."""
    return Notification(
        id=uuid4(),
        user_id=sample_user_id,
        type="class_started",
        title="Class Started",
        message="Your Data Structures class has started",
        data={"class_id": str(uuid4()), "room": "101"},
        is_read=False,
        created_at=datetime.utcnow()
    )


@pytest.fixture
def notification_repository(mock_db_session):
    """Create a notification repository with mock session."""
    return NotificationRepository(mock_db_session)


@pytest.fixture
def notification_service(mock_db_session):
    """Create a notification service with mock session."""
    return NotificationService(mock_db_session)


# ==================== Factory Pattern Tests ====================

class TestNotificationFactory:
    """Tests for NotificationFactory."""
    
    def test_create_class_started_notification(self, sample_user_id):
        """Test creating a class_started notification."""
        data = {"class_name": "Data Structures", "room": "101"}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.CLASS_STARTED,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.user_id == sample_user_id
        assert notification.type == "class_started"
        assert notification.title == "Class Started"
        assert "Data Structures" in notification.message
        assert "Room 101" in notification.message
        assert notification.data == data
    
    def test_create_attendance_confirmed_notification(self, sample_user_id):
        """Test creating an attendance_confirmed notification."""
        data = {"class_name": "Algorithms", "confidence": 0.95}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.ATTENDANCE_CONFIRMED,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "attendance_confirmed"
        assert notification.title == "Attendance Confirmed"
        assert "Algorithms" in notification.message
        assert "95%" in notification.message  # Confidence formatted as percentage
    
    def test_create_class_cancelled_notification(self, sample_user_id):
        """Test creating a class_cancelled notification."""
        data = {"class_name": "Physics", "reason": "Instructor unavailable"}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.CLASS_CANCELLED,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "class_cancelled"
        assert "Physics" in notification.message
        assert "Instructor unavailable" in notification.message
    
    def test_create_attendance_late_notification(self, sample_user_id):
        """Test creating an attendance_late notification."""
        data = {"class_name": "Chemistry", "minutes_late": 10}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.ATTENDANCE_LATE,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "attendance_late"
        assert "10 minutes" in notification.message
    
    def test_create_schedule_updated_notification(self, sample_user_id):
        """Test creating a schedule_updated notification."""
        data = {"class_name": "Math", "change_type": "rescheduled"}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.SCHEDULE_UPDATED,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "schedule_updated"
        assert "Math" in notification.message
    
    def test_create_enrollment_confirmed_notification(self, sample_user_id):
        """Test creating an enrollment_confirmed notification."""
        data = {"class_name": "Biology 101", "course_name": "Introduction to Biology"}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.ENROLLMENT_CONFIRMED,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "enrollment_confirmed"
        assert "Biology 101" in notification.message
    
    def test_create_system_announcement_notification(self, sample_user_id):
        """Test creating a system_announcement notification."""
        data = {"title": "Maintenance Notice", "message": "System will be down at 2 AM"}
        
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.SYSTEM_ANNOUNCEMENT,
            user_id=sample_user_id,
            data=data
        )
        
        assert notification.type == "system_announcement"
        assert notification.title == "Maintenance Notice"
    
    def test_unknown_notification_type_raises_error(self, sample_user_id):
        """Test that unknown notification type raises ValueError."""
        with pytest.raises(ValueError) as exc_info:
            NotificationFactory.create_notification(
                notification_type="unknown_type",
                user_id=sample_user_id,
                data={}
            )
        
        assert "Unknown notification type" in str(exc_info.value)
    
    def test_get_supported_types(self):
        """Test getting list of supported notification types."""
        types = NotificationFactory.get_supported_types()
        
        assert isinstance(types, list)
        assert len(types) == 11
        assert "class_started" in types
        assert "attendance_confirmed" in types
        assert "schedule_updated" in types
    
    def test_notification_with_empty_data(self, sample_user_id):
        """Test creating notification with empty data."""
        notification = NotificationFactory.create_notification(
            notification_type=NotificationFactory.CLASS_STARTED,
            user_id=sample_user_id,
            data={}
        )
        
        assert notification is not None
        assert notification.type == "class_started"
        # Should use default values
        assert "Your class" in notification.message


# ==================== Repository Pattern Tests ====================

class TestNotificationRepository:
    """Tests for NotificationRepository."""
    
    def test_create_notification(self, notification_repository, sample_notification, mock_db_session):
        """Test creating a notification."""
        # Setup mock to return the notification on refresh
        mock_db_session.refresh = MagicMock(side_effect=lambda x: None)
        
        result = notification_repository.create(sample_notification)
        
        mock_db_session.add.assert_called_once_with(sample_notification)
        mock_db_session.flush.assert_called_once()
    
    def test_find_by_id(self, notification_repository, sample_notification, mock_db_session):
        """Test finding notification by ID."""
        # Setup mock query chain
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = sample_notification
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.find_by_id(sample_notification.id)
        
        assert result == sample_notification
    
    def test_find_by_user(self, notification_repository, sample_user_id, mock_db_session):
        """Test finding notifications by user."""
        notifications = [
            Notification(id=uuid4(), user_id=sample_user_id, type="test", title="Test", message="Test"),
            Notification(id=uuid4(), user_id=sample_user_id, type="test2", title="Test2", message="Test2"),
        ]
        
        # Setup mock query chain
        mock_query = MagicMock()
        mock_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = notifications
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.find_by_user(sample_user_id)
        
        assert len(result) == 2
    
    def test_count_by_user(self, notification_repository, sample_user_id, mock_db_session):
        """Test counting notifications by user."""
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 5
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.count_by_user(sample_user_id)
        
        assert result == 5
    
    def test_count_unread_by_user(self, notification_repository, sample_user_id, mock_db_session):
        """Test counting unread notifications by user."""
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 3
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.count_unread_by_user(sample_user_id)
        
        assert result == 3
    
    def test_mark_as_read(self, notification_repository, sample_notification, mock_db_session):
        """Test marking notification as read."""
        sample_notification.is_read = False
        
        # Setup mock to return the notification
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = sample_notification
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.mark_as_read(sample_notification.id)
        
        assert result.is_read == True
    
    def test_delete_notification(self, notification_repository, sample_notification, mock_db_session):
        """Test deleting a notification."""
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = sample_notification
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.delete(sample_notification.id)
        
        assert result == True
        mock_db_session.delete.assert_called_once_with(sample_notification)
    
    def test_delete_nonexistent_notification(self, notification_repository, mock_db_session):
        """Test deleting a notification that doesn't exist."""
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        mock_db_session.query.return_value = mock_query
        
        result = notification_repository.delete(uuid4())
        
        assert result == False


# ==================== Observer Pattern Tests ====================

class TestNotificationSubject:
    """Tests for NotificationSubject (Observer pattern)."""
    
    def test_singleton_pattern(self):
        """Test that NotificationSubject is a singleton."""
        subject1 = NotificationSubject()
        subject2 = NotificationSubject()
        
        assert subject1 is subject2
    
    def test_attach_observer(self):
        """Test attaching an observer."""
        subject = NotificationSubject()
        
        # Create mock observer
        observer = MagicMock(spec=INotificationObserver)
        observer.get_user_id.return_value = "user-123"
        observer.is_active.return_value = True
        
        initial_count = subject.get_observer_count("user-123")
        subject.attach(observer)
        
        assert subject.get_observer_count("user-123") == initial_count + 1
        
        # Cleanup
        subject.detach(observer)
    
    def test_detach_observer(self):
        """Test detaching an observer."""
        subject = NotificationSubject()
        
        observer = MagicMock(spec=INotificationObserver)
        observer.get_user_id.return_value = "user-456"
        observer.is_active.return_value = True
        
        subject.attach(observer)
        count_after_attach = subject.get_observer_count("user-456")
        
        subject.detach(observer)
        count_after_detach = subject.get_observer_count("user-456")
        
        assert count_after_detach == count_after_attach - 1
    
    @pytest.mark.asyncio
    async def test_notify_observers(self):
        """Test notifying observers."""
        subject = NotificationSubject()
        
        # Create mock observer
        observer = MagicMock(spec=INotificationObserver)
        observer.get_user_id.return_value = "user-789"
        observer.is_active.return_value = True
        observer.update = AsyncMock(return_value=True)
        
        subject.attach(observer)
        
        notification = {"type": "test", "message": "Test notification"}
        count = await subject.notify("user-789", notification)
        
        assert count >= 1
        observer.update.assert_called_with(notification)
        
        # Cleanup
        subject.detach(observer)
    
    def test_is_user_connected(self):
        """Test checking if user is connected."""
        subject = NotificationSubject()
        
        observer = MagicMock(spec=INotificationObserver)
        observer.get_user_id.return_value = "connected-user"
        observer.is_active.return_value = True
        
        assert not subject.is_user_connected("connected-user")
        
        subject.attach(observer)
        assert subject.is_user_connected("connected-user")
        
        subject.detach(observer)
        assert not subject.is_user_connected("connected-user")
    
    def test_get_connected_users(self):
        """Test getting list of connected users."""
        subject = NotificationSubject()
        
        observer1 = MagicMock(spec=INotificationObserver)
        observer1.get_user_id.return_value = "user-a"
        observer1.is_active.return_value = True
        
        observer2 = MagicMock(spec=INotificationObserver)
        observer2.get_user_id.return_value = "user-b"
        observer2.is_active.return_value = True
        
        subject.attach(observer1)
        subject.attach(observer2)
        
        connected = subject.get_connected_users()
        
        assert "user-a" in connected
        assert "user-b" in connected
        
        # Cleanup
        subject.detach(observer1)
        subject.detach(observer2)


# ==================== WebSocket Observer Tests ====================

class TestWebSocketObserver:
    """Tests for WebSocketObserver."""
    
    def test_get_user_id(self):
        """Test getting user ID from observer."""
        mock_websocket = MagicMock()
        observer = WebSocketObserver(mock_websocket, "test-user-id")
        
        assert observer.get_user_id() == "test-user-id"
    
    def test_is_active_initially(self):
        """Test that observer is active when created."""
        mock_websocket = MagicMock()
        observer = WebSocketObserver(mock_websocket, "test-user")
        
        assert observer.is_active() == True
    
    def test_deactivate(self):
        """Test deactivating observer."""
        mock_websocket = MagicMock()
        observer = WebSocketObserver(mock_websocket, "test-user")
        
        observer.deactivate()
        
        assert observer.is_active() == False
    
    @pytest.mark.asyncio
    async def test_update_sends_message(self):
        """Test that update sends message via WebSocket."""
        mock_websocket = MagicMock()
        mock_websocket.send_json = AsyncMock()
        
        observer = WebSocketObserver(mock_websocket, "test-user")
        notification = {"id": "123", "type": "test", "message": "Hello"}
        
        result = await observer.update(notification)
        
        assert result == True
        mock_websocket.send_json.assert_called_once()
        
        # Verify message format
        call_args = mock_websocket.send_json.call_args[0][0]
        assert call_args["type"] == "notification"
        assert call_args["payload"] == notification
    
    @pytest.mark.asyncio
    async def test_update_fails_when_inactive(self):
        """Test that update fails when observer is inactive."""
        mock_websocket = MagicMock()
        mock_websocket.send_json = AsyncMock()
        
        observer = WebSocketObserver(mock_websocket, "test-user")
        observer.deactivate()
        
        result = await observer.update({"test": "data"})
        
        assert result == False
        mock_websocket.send_json.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_update_handles_exception(self):
        """Test that update handles WebSocket exceptions."""
        mock_websocket = MagicMock()
        mock_websocket.send_json = AsyncMock(side_effect=Exception("Connection closed"))
        
        observer = WebSocketObserver(mock_websocket, "test-user")
        
        result = await observer.update({"test": "data"})
        
        assert result == False
        assert observer.is_active() == False  # Should be deactivated after error


# ==================== Service Tests ====================

class TestNotificationService:
    """Tests for NotificationService."""
    
    def test_create_notification(self, notification_service, sample_user_id, mock_db_session):
        """Test creating a notification via service."""
        # Setup mock
        mock_query = MagicMock()
        mock_db_session.query.return_value = mock_query
        
        notification = notification_service.create_notification(
            user_id=sample_user_id,
            notification_type="test_type",
            title="Test Title",
            message="Test Message",
            data={"key": "value"}
        )
        
        mock_db_session.add.assert_called_once()
    
    def test_create_typed_notification(self, notification_service, sample_user_id, mock_db_session):
        """Test creating a typed notification via factory."""
        notification = notification_service.create_typed_notification(
            notification_type=NotificationFactory.CLASS_STARTED,
            user_id=sample_user_id,
            data={"class_name": "Test Class"}
        )
        
        mock_db_session.add.assert_called_once()
    
    def test_get_notification_counts(self, notification_service, sample_user_id, mock_db_session):
        """Test getting notification counts."""
        mock_query = MagicMock()
        mock_query.filter.return_value.count.return_value = 10
        mock_db_session.query.return_value = mock_query
        
        counts = notification_service.get_notification_counts(sample_user_id)
        
        assert "total" in counts
        assert "unread" in counts
    
    def test_mark_as_read(self, notification_service, mock_db_session):
        """Test marking notification as read."""
        notification_id = uuid4()
        mock_notification = Notification(
            id=notification_id,
            user_id=uuid4(),
            type="test",
            title="Test",
            message="Test",
            is_read=False
        )
        
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = mock_notification
        mock_db_session.query.return_value = mock_query
        
        result = notification_service.mark_as_read(notification_id)
        
        assert result.is_read == True
    
    def test_get_supported_notification_types(self, notification_service):
        """Test getting supported notification types."""
        types = notification_service.get_supported_notification_types()
        
        assert isinstance(types, list)
        assert len(types) > 0
        assert "class_started" in types


# ==================== Model Tests ====================

class TestNotificationModel:
    """Tests for Notification model."""
    
    def test_notification_creation(self, sample_user_id):
        """Test creating a notification model."""
        notification = Notification(
            user_id=sample_user_id,
            type="test_type",
            title="Test Title",
            message="Test Message",
            data={"key": "value"},
            is_read=False  # Explicitly set for test
        )
        
        assert notification.user_id == sample_user_id
        assert notification.type == "test_type"
        assert notification.title == "Test Title"
        assert notification.is_read == False
    
    def test_notification_to_dict(self, sample_notification):
        """Test converting notification to dictionary."""
        result = sample_notification.to_dict()
        
        assert isinstance(result, dict)
        assert "id" in result
        assert "user_id" in result
        assert "type" in result
        assert "title" in result
        assert "message" in result
        assert "is_read" in result
        assert "created_at" in result
    
    def test_notification_repr(self, sample_notification):
        """Test notification string representation."""
        repr_str = repr(sample_notification)
        
        assert "Notification" in repr_str
        assert str(sample_notification.id) in repr_str


# ==================== Integration-like Tests ====================

class TestNotificationFlow:
    """Tests for complete notification flows."""
    
    @pytest.mark.asyncio
    async def test_create_and_broadcast_flow(self, mock_db_session):
        """Test the complete create and broadcast flow."""
        service = NotificationService(mock_db_session)
        user_ids = [uuid4(), uuid4()]
        
        # This tests the flow without actual WebSocket connections
        # In real scenario, users would be connected via WebSocket
        
        notifications = await service.create_and_broadcast(
            notification_type=NotificationFactory.CLASS_STARTED,
            user_ids=user_ids,
            data={"class_name": "Test Class", "room": "101"}
        )
        
        # Should create notifications for both users
        assert mock_db_session.add.call_count == 2
    
    def test_notification_type_consistency(self):
        """Test that factory types match expected values."""
        expected_types = [
            "class_started",
            "class_ended",
            "class_cancelled",
            "class_rescheduled",
            "attendance_confirmed",
            "attendance_absent",
            "attendance_late",
            "schedule_updated",
            "enrollment_confirmed",
            "enrollment_removed",
            "system_announcement",
        ]
        
        actual_types = NotificationFactory.get_supported_types()
        
        for expected in expected_types:
            assert expected in actual_types, f"Missing type: {expected}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
