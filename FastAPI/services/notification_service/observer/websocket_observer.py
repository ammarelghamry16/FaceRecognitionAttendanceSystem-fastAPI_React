"""
WebSocket Observer for real-time notification delivery.
"""
import json
import logging
from typing import Any
from fastapi import WebSocket

from .observer import INotificationObserver

logger = logging.getLogger(__name__)


class WebSocketObserver(INotificationObserver):
    """
    WebSocket-based notification observer.
    
    Delivers notifications to clients via WebSocket connection.
    Implements the Observer interface for the notification system.
    """
    
    def __init__(self, websocket: WebSocket, user_id: str):
        """
        Initialize WebSocket observer.
        
        Args:
            websocket: The WebSocket connection
            user_id: The user ID this observer belongs to
        """
        self._websocket = websocket
        self._user_id = user_id
        self._active = True
    
    async def update(self, notification: Any) -> bool:
        """
        Send notification to the WebSocket client.
        
        Args:
            notification: The notification data to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self._active:
            return False
        
        try:
            # Format the message
            message = {
                "type": "notification",
                "payload": notification
            }
            
            # Send as JSON
            await self._websocket.send_json(message)
            logger.debug(f"Notification sent to user {self._user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification to user {self._user_id}: {e}")
            self._active = False
            return False
    
    def get_user_id(self) -> str:
        """Get the user ID for this observer."""
        return self._user_id
    
    def is_active(self) -> bool:
        """Check if the WebSocket connection is still active."""
        return self._active
    
    def deactivate(self) -> None:
        """Mark this observer as inactive."""
        self._active = False
    
    async def send_message(self, message_type: str, data: Any) -> bool:
        """
        Send a custom message to the WebSocket client.
        
        Args:
            message_type: Type of message
            data: Message data
            
        Returns:
            True if sent successfully
        """
        if not self._active:
            return False
        
        try:
            message = {
                "type": message_type,
                "payload": data
            }
            await self._websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send message to user {self._user_id}: {e}")
            self._active = False
            return False
    
    async def send_ping(self) -> bool:
        """
        Send a ping message to check connection.
        
        Returns:
            True if ping sent successfully
        """
        return await self.send_message("ping", {"timestamp": "now"})
