"""
Notification service implementing business logic.
Orchestrates notification creation, storage, and delivery.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
import logging

from ..repositories.notification_repository import NotificationRepository
from ..factory.notification_factory import NotificationFactory
from ..observer.subject import notification_subject
from ..models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for managing notifications.
    
    Combines Factory pattern for creation, Repository pattern for storage,
    and Observer pattern for real-time delivery.
    """
    
    def __init__(self, db: Session):
        """
        Initialize notification service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.repository = NotificationRepository(db)
        self.factory = NotificationFactory
        self.subject = notification_subject
    
    # ==================== Create Operations ====================
    
    def create_notification(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a notification manually (without factory).
        
        Args:
            user_id: ID of the user to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            data: Additional data
            
        Returns:
            Created notification
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data
        )
        return self.repository.create(notification)
    
    def create_typed_notification(
        self,
        notification_type: str,
        user_id: UUID,
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a notification using the factory.
        
        Args:
            notification_type: Type of notification (from NotificationFactory constants)
            user_id: ID of the user to notify
            data: Additional data for the notification
            
        Returns:
            Created notification
        """
        notification = self.factory.create_notification(
            notification_type=notification_type,
            user_id=user_id,
            data=data
        )
        return self.repository.create(notification)
    
    async def create_and_broadcast(
        self,
        notification_type: str,
        user_ids: List[UUID],
        data: Optional[Dict[str, Any]] = None
    ) -> List[Notification]:
        """
        Create notifications for multiple users and broadcast via WebSocket.
        
        This is the main method for sending notifications from other services.
        
        Args:
            notification_type: Type of notification
            user_ids: List of user IDs to notify
            data: Additional data for the notification
            
        Returns:
            List of created notifications
        """
        notifications = []
        
        for user_id in user_ids:
            try:
                # Create notification using factory
                notification = self.factory.create_notification(
                    notification_type=notification_type,
                    user_id=user_id,
                    data=data
                )
                
                # Save to database
                saved_notification = self.repository.create(notification)
                notifications.append(saved_notification)
                
                # Broadcast via WebSocket if user is connected
                await self.subject.notify(
                    str(user_id),
                    saved_notification.to_dict()
                )
                
            except Exception as e:
                logger.error(f"Failed to create notification for user {user_id}: {e}")
        
        return notifications
    
    async def broadcast_to_user(
        self,
        user_id: UUID,
        notification: Notification
    ) -> bool:
        """
        Broadcast an existing notification to a user via WebSocket.
        
        Args:
            user_id: ID of the user
            notification: The notification to broadcast
            
        Returns:
            True if at least one observer received the notification
        """
        count = await self.subject.notify(str(user_id), notification.to_dict())
        return count > 0
    
    # ==================== Read Operations ====================
    
    def get_notification(self, notification_id: UUID) -> Optional[Notification]:
        """
        Get a notification by ID.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            Notification if found
        """
        return self.repository.find_by_id(notification_id)
    
    def get_user_notifications(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        """
        Get all notifications for a user.
        
        Args:
            user_id: UUID of the user
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of notifications
        """
        return self.repository.find_by_user(user_id, skip=skip, limit=limit)
    
    def get_unread_notifications(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        """
        Get unread notifications for a user.
        
        Args:
            user_id: UUID of the user
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of unread notifications
        """
        return self.repository.find_unread_by_user(user_id, skip=skip, limit=limit)
    
    def get_notification_counts(self, user_id: UUID) -> Dict[str, int]:
        """
        Get notification counts for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Dict with total and unread counts
        """
        return {
            "total": self.repository.count_by_user(user_id),
            "unread": self.repository.count_unread_by_user(user_id)
        }
    
    def get_notifications_by_type(
        self,
        user_id: UUID,
        notification_type: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[Notification]:
        """
        Get notifications of a specific type for a user.
        
        Args:
            user_id: UUID of the user
            notification_type: Type of notification
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of notifications
        """
        return self.repository.find_by_type(user_id, notification_type, skip=skip, limit=limit)
    
    # ==================== Update Operations ====================
    
    def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:
        """
        Mark a notification as read.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            Updated notification if found
        """
        return self.repository.mark_as_read(notification_id)
    
    def mark_all_as_read(self, user_id: UUID) -> int:
        """
        Mark all notifications as read for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Number of notifications marked as read
        """
        return self.repository.mark_all_as_read(user_id)
    
    # ==================== Delete Operations ====================
    
    def delete_notification(self, notification_id: UUID) -> bool:
        """
        Delete a notification.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            True if deleted
        """
        return self.repository.delete(notification_id)
    
    def delete_all_user_notifications(self, user_id: UUID) -> int:
        """
        Delete all notifications for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Number of notifications deleted
        """
        return self.repository.delete_all_by_user(user_id)
    
    # ==================== WebSocket Status ====================
    
    def is_user_connected(self, user_id: UUID) -> bool:
        """
        Check if a user has an active WebSocket connection.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            True if user is connected
        """
        return self.subject.is_user_connected(str(user_id))
    
    def get_connected_users_count(self) -> int:
        """
        Get the number of users with active WebSocket connections.
        
        Returns:
            Number of connected users
        """
        return len(self.subject.get_connected_users())
    
    # ==================== Utility ====================
    
    def get_supported_notification_types(self) -> List[str]:
        """
        Get list of supported notification types.
        
        Returns:
            List of notification type strings
        """
        return self.factory.get_supported_types()
