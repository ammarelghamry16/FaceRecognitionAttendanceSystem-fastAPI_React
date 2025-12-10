"""
Notification request schemas.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: UUID = Field(..., description="ID of the user to notify")
    type: str = Field(..., description="Notification type", max_length=50)
    title: str = Field(..., description="Notification title", max_length=255)
    message: str = Field(..., description="Notification message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional notification data")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                "type": "class_started",
                "title": "Class Started",
                "message": "Your Data Structures class has started in Room 101",
                "data": {"class_id": "550e8400-e29b-41d4-a716-446655440010", "room": "101"}
            }
        }


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""
    is_read: Optional[bool] = Field(None, description="Mark as read/unread")

    class Config:
        json_schema_extra = {
            "example": {
                "is_read": True
            }
        }


class BroadcastNotification(BaseModel):
    """Schema for broadcasting notification to multiple users."""
    user_ids: List[UUID] = Field(..., description="List of user IDs to notify")
    type: str = Field(..., description="Notification type", max_length=50)
    title: str = Field(..., description="Notification title", max_length=255)
    message: str = Field(..., description="Notification message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional notification data")

    class Config:
        json_schema_extra = {
            "example": {
                "user_ids": [
                    "550e8400-e29b-41d4-a716-446655440001",
                    "550e8400-e29b-41d4-a716-446655440002"
                ],
                "type": "schedule_updated",
                "title": "Schedule Updated",
                "message": "Your class schedule has been updated",
                "data": {"class_id": "550e8400-e29b-41d4-a716-446655440010"}
            }
        }
