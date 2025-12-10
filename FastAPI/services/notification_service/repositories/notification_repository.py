"""
Notification repository for data access.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.notification import Notification


class NotificationRepository:
    """
    Repository for managing Notification entities.
    Implements Repository pattern for data access abstraction.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Notification
    
    def create(self, notification: Notification) -> Notification:
        """
        Create a new notification.
        
        Args:
            notification: Notification entity to create
            
        Returns:
            Created notification
        """
        self.db.add(notification)
        self.db.flush()
        self.db.refresh(notification)
        return notification
    
    def create_many(self, notifications: List[Notification]) -> List[Notification]:
        """
        Create multiple notifications at once.
        
        Args:
            notifications: List of notification entities
            
        Returns:
            List of created notifications
        """
        self.db.add_all(notifications)
        self.db.flush()
        for notification in notifications:
            self.db.refresh(notification)
        return notifications
    
    def find_by_id(self, notification_id: UUID) -> Optional[Notification]:
        """
        Find notification by ID.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            Notification if found, None otherwise
        """
        return self.db.query(self.model).filter(self.model.id == notification_id).first()
    
    def find_by_user(
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
            limit: Maximum number of records to return
            
        Returns:
            List of notifications ordered by created_at desc
        """
        return (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def find_unread_by_user(
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
            limit: Maximum number of records to return
            
        Returns:
            List of unread notifications
        """
        return (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id, self.model.is_read == False)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def count_by_user(self, user_id: UUID) -> int:
        """
        Count total notifications for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Total count
        """
        return self.db.query(self.model).filter(self.model.user_id == user_id).count()
    
    def count_unread_by_user(self, user_id: UUID) -> int:
        """
        Count unread notifications for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Unread count
        """
        return (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id, self.model.is_read == False)
            .count()
        )
    
    def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:
        """
        Mark a notification as read.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            Updated notification if found
        """
        notification = self.find_by_id(notification_id)
        if notification:
            notification.is_read = True
            self.db.flush()
            self.db.refresh(notification)
        return notification
    
    def mark_all_as_read(self, user_id: UUID) -> int:
        """
        Mark all notifications as read for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Number of notifications marked as read
        """
        result = (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id, self.model.is_read == False)
            .update({"is_read": True})
        )
        self.db.flush()
        return result
    
    def delete(self, notification_id: UUID) -> bool:
        """
        Delete a notification.
        
        Args:
            notification_id: UUID of the notification
            
        Returns:
            True if deleted, False if not found
        """
        notification = self.find_by_id(notification_id)
        if notification:
            self.db.delete(notification)
            self.db.flush()
            return True
        return False
    
    def delete_all_by_user(self, user_id: UUID) -> int:
        """
        Delete all notifications for a user.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Number of notifications deleted
        """
        result = self.db.query(self.model).filter(self.model.user_id == user_id).delete()
        self.db.flush()
        return result
    
    def find_by_type(
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
            limit: Maximum number of records to return
            
        Returns:
            List of notifications
        """
        return (
            self.db.query(self.model)
            .filter(
                self.model.user_id == user_id,
                self.model.type == notification_type
            )
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
