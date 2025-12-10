"""
Observer interface for notification delivery.
Implements Observer pattern for real-time notification delivery.
"""
from abc import ABC, abstractmethod
from typing import Any


class INotificationObserver(ABC):
    """
    Abstract base class for notification observers.
    
    Observers implement this interface to receive notifications
    when the NotificationSubject broadcasts them.
    """
    
    @abstractmethod
    async def update(self, notification: Any) -> bool:
        """
        Called when a notification is broadcast.
        
        Args:
            notification: The notification data to deliver
            
        Returns:
            True if delivery was successful, False otherwise
        """
        pass
    
    @abstractmethod
    def get_user_id(self) -> str:
        """
        Get the user ID this observer is associated with.
        
        Returns:
            User ID as string
        """
        pass
    
    @abstractmethod
    def is_active(self) -> bool:
        """
        Check if the observer is still active/connected.
        
        Returns:
            True if active, False otherwise
        """
        pass
