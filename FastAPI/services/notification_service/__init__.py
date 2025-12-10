"""
Notification Service Module

This service handles all notification-related functionality including:
- Creating notifications using Factory pattern
- Storing notifications in database using Repository pattern
- Real-time delivery via WebSocket using Observer pattern

Design Patterns Used:
- Factory Pattern: NotificationFactory creates different notification types
- Repository Pattern: NotificationRepository abstracts data access
- Observer Pattern: NotificationSubject + WebSocketObserver for real-time delivery
- Singleton Pattern: NotificationSubject is a singleton

Usage:
    from services.notification_service.services import NotificationService
    from services.notification_service.factory import NotificationFactory
    from services.notification_service.observer import notification_subject
    
    # Create and broadcast notification
    service = NotificationService(db_session)
    await service.create_and_broadcast(
        notification_type=NotificationFactory.CLASS_STARTED,
        user_ids=[student_id_1, student_id_2],
        data={"class_name": "Data Structures", "room": "101"}
    )
"""

from .services.notification_service import NotificationService
from .factory.notification_factory import NotificationFactory
from .observer.subject import notification_subject, NotificationSubject
from .observer.observer import INotificationObserver
from .observer.websocket_observer import WebSocketObserver
from .models.notification import Notification
from .repositories.notification_repository import NotificationRepository

__all__ = [
    "NotificationService",
    "NotificationFactory",
    "NotificationSubject",
    "notification_subject",
    "INotificationObserver",
    "WebSocketObserver",
    "Notification",
    "NotificationRepository",
]
