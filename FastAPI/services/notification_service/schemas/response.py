"""
Notification response schemas.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440099",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "type": "class_started",
                "title": "Class Started",
                "message": "Your Data Structures class has started in Room 101",
                "data": {"class_id": "550e8400-e29b-41d4-a716-446655440010", "room": "101"},
                "is_read": False,
                "created_at": "2024-12-10T10:30:00"
            }
        }


class NotificationListResponse(BaseModel):
    """Schema for paginated notification list response."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    skip: int
    limit: int

    class Config:
        json_schema_extra = {
            "example": {
                "notifications": [],
                "total": 25,
                "unread_count": 5,
                "skip": 0,
                "limit": 20
            }
        }


class WebSocketMessage(BaseModel):
    """Schema for WebSocket notification message."""
    type: str = Field(default="notification", description="Message type")
    payload: NotificationResponse

    class Config:
        json_schema_extra = {
            "example": {
                "type": "notification",
                "payload": {
                    "id": "550e8400-e29b-41d4-a716-446655440099",
                    "user_id": "550e8400-e29b-41d4-a716-446655440001",
                    "type": "attendance_confirmed",
                    "title": "Attendance Confirmed",
                    "message": "Your attendance has been marked as present",
                    "data": {},
                    "is_read": False,
                    "created_at": "2024-12-10T10:30:00"
                }
            }
        }
