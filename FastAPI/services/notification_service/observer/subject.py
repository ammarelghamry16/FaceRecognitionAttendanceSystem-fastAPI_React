"""
Notification Subject implementing Observer pattern.
Manages observers and broadcasts notifications.
"""
from typing import Dict, List, Optional
from uuid import UUID
import logging
import asyncio

from .observer import INotificationObserver

logger = logging.getLogger(__name__)


class NotificationSubject:
    """
    Subject class that manages notification observers.
    
    Implements the Subject part of the Observer pattern.
    Maintains a list of observers and notifies them when
    notifications need to be delivered.
    """
    
    _instance: Optional['NotificationSubject'] = None
    
    def __new__(cls) -> 'NotificationSubject':
        """Singleton pattern - ensure only one subject exists."""
        if cls._instance is None:
            cls._instance = super(NotificationSubject, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the subject."""
        if self._initialized:
            return
        
        # Map of user_id -> list of observers
        self._observers: Dict[str, List[INotificationObserver]] = {}
        self._initialized = True
        logger.info("NotificationSubject initialized")
    
    def attach(self, observer: INotificationObserver) -> None:
        """
        Attach an observer to receive notifications.
        
        Args:
            observer: The observer to attach
        """
        user_id = observer.get_user_id()
        
        if user_id not in self._observers:
            self._observers[user_id] = []
        
        # Avoid duplicate observers
        if observer not in self._observers[user_id]:
            self._observers[user_id].append(observer)
            logger.info(f"Observer attached for user {user_id}. Total observers: {len(self._observers[user_id])}")
    
    def detach(self, observer: INotificationObserver) -> None:
        """
        Detach an observer from receiving notifications.
        
        Args:
            observer: The observer to detach
        """
        user_id = observer.get_user_id()
        
        if user_id in self._observers:
            try:
                self._observers[user_id].remove(observer)
                logger.info(f"Observer detached for user {user_id}")
                
                # Clean up empty lists
                if not self._observers[user_id]:
                    del self._observers[user_id]
            except ValueError:
                pass  # Observer not in list
    
    async def notify(self, user_id: str, notification: dict) -> int:
        """
        Notify all observers for a specific user.
        
        Args:
            user_id: The user ID to notify
            notification: The notification data
            
        Returns:
            Number of observers successfully notified
        """
        if user_id not in self._observers:
            logger.debug(f"No observers for user {user_id}")
            return 0
        
        # Clean up inactive observers first
        self._cleanup_inactive_observers(user_id)
        
        if user_id not in self._observers:
            return 0
        
        success_count = 0
        failed_observers = []
        
        for observer in self._observers[user_id]:
            try:
                if observer.is_active():
                    result = await observer.update(notification)
                    if result:
                        success_count += 1
                else:
                    failed_observers.append(observer)
            except Exception as e:
                logger.error(f"Error notifying observer for user {user_id}: {e}")
                failed_observers.append(observer)
        
        # Remove failed observers
        for observer in failed_observers:
            self.detach(observer)
        
        logger.info(f"Notified {success_count} observers for user {user_id}")
        return success_count
    
    async def notify_many(self, user_ids: List[str], notification: dict) -> Dict[str, int]:
        """
        Notify multiple users.
        
        Args:
            user_ids: List of user IDs to notify
            notification: The notification data
            
        Returns:
            Dict mapping user_id to number of successful deliveries
        """
        results = {}
        
        # Notify all users concurrently
        tasks = [self.notify(user_id, notification) for user_id in user_ids]
        counts = await asyncio.gather(*tasks, return_exceptions=True)
        
        for user_id, count in zip(user_ids, counts):
            if isinstance(count, Exception):
                logger.error(f"Error notifying user {user_id}: {count}")
                results[user_id] = 0
            else:
                results[user_id] = count
        
        return results
    
    async def broadcast_all(self, notification: dict) -> int:
        """
        Broadcast notification to all connected observers.
        
        Args:
            notification: The notification data
            
        Returns:
            Total number of successful deliveries
        """
        total = 0
        for user_id in list(self._observers.keys()):
            count = await self.notify(user_id, notification)
            total += count
        return total
    
    def _cleanup_inactive_observers(self, user_id: str) -> None:
        """Remove inactive observers for a user."""
        if user_id not in self._observers:
            return
        
        active_observers = [
            obs for obs in self._observers[user_id] 
            if obs.is_active()
        ]
        
        if active_observers:
            self._observers[user_id] = active_observers
        else:
            del self._observers[user_id]
    
    def get_observer_count(self, user_id: Optional[str] = None) -> int:
        """
        Get the number of observers.
        
        Args:
            user_id: Optional user ID to count observers for
            
        Returns:
            Number of observers
        """
        if user_id:
            return len(self._observers.get(user_id, []))
        return sum(len(obs) for obs in self._observers.values())
    
    def get_connected_users(self) -> List[str]:
        """
        Get list of user IDs with active observers.
        
        Returns:
            List of user IDs
        """
        return list(self._observers.keys())
    
    def is_user_connected(self, user_id: str) -> bool:
        """
        Check if a user has any active observers.
        
        Args:
            user_id: The user ID to check
            
        Returns:
            True if user has active observers
        """
        return user_id in self._observers and len(self._observers[user_id]) > 0


# Global instance for easy access
notification_subject = NotificationSubject()
