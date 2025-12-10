"""
FastAPI routes for notification service.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from shared.database.connection import get_db_session
from ..services.notification_service import NotificationService
from ..schemas.request import NotificationCreate, BroadcastNotification
from ..schemas.response import NotificationResponse, NotificationListResponse

router = APIRouter()


# ==================== Notification Endpoints ====================

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """
    Get all notifications (admin endpoint).
    
    Note: In production, this should be protected and filtered by current user.
    """
    # TODO: When auth is implemented, get user_id from current_user
    # For now, this returns empty list as we need a user_id
    return []


@router.get("/types", response_model=List[str])
def get_notification_types(db: Session = Depends(get_db_session)):
    """Get list of supported notification types."""
    service = NotificationService(db)
    return service.get_supported_notification_types()


@router.get("/user/{user_id}", response_model=NotificationListResponse)
def get_user_notifications(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """
    Get all notifications for a specific user.
    
    - **user_id**: UUID of the user
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    service = NotificationService(db)
    notifications = service.get_user_notifications(user_id, skip=skip, limit=limit)
    counts = service.get_notification_counts(user_id)
    
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=counts["total"],
        unread_count=counts["unread"],
        skip=skip,
        limit=limit
    )


@router.get("/user/{user_id}/unread", response_model=List[NotificationResponse])
def get_unread_notifications(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get unread notifications for a user."""
    service = NotificationService(db)
    notifications = service.get_unread_notifications(user_id, skip=skip, limit=limit)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/user/{user_id}/count")
def get_notification_counts(
    user_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get notification counts for a user."""
    service = NotificationService(db)
    return service.get_notification_counts(user_id)


@router.get("/user/{user_id}/connected")
def check_user_connected(
    user_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Check if a user has an active WebSocket connection."""
    service = NotificationService(db)
    return {
        "user_id": str(user_id),
        "connected": service.is_user_connected(user_id)
    }


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get a specific notification by ID."""
    service = NotificationService(db)
    notification = service.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create a new notification.
    
    This endpoint creates a notification and stores it in the database.
    If the user is connected via WebSocket, they will receive it in real-time.
    """
    try:
        service = NotificationService(db)
        notification = service.create_notification(
            user_id=notification_data.user_id,
            notification_type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            data=notification_data.data
        )
        return NotificationResponse.model_validate(notification)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/broadcast", response_model=List[NotificationResponse], status_code=status.HTTP_201_CREATED)
async def broadcast_notification(
    broadcast_data: BroadcastNotification,
    db: Session = Depends(get_db_session)
):
    """
    Broadcast a notification to multiple users.
    
    Creates notifications for all specified users and delivers via WebSocket
    to those who are connected.
    """
    try:
        service = NotificationService(db)
        notifications = await service.create_and_broadcast(
            notification_type=broadcast_data.type,
            user_ids=broadcast_data.user_ids,
            data=broadcast_data.data
        )
        return [NotificationResponse.model_validate(n) for n in notifications]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Mark a notification as read."""
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.put("/user/{user_id}/read-all")
def mark_all_notifications_read(
    user_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Mark all notifications as read for a user."""
    service = NotificationService(db)
    count = service.mark_all_as_read(user_id)
    return {"marked_count": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Delete a notification."""
    service = NotificationService(db)
    deleted = service.delete_notification(notification_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return None


@router.delete("/user/{user_id}/all")
def delete_all_user_notifications(
    user_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Delete all notifications for a user."""
    service = NotificationService(db)
    count = service.delete_all_user_notifications(user_id)
    return {"deleted_count": count}


# ==================== Stats Endpoints ====================

@router.get("/stats/connected-users")
def get_connected_users_count(db: Session = Depends(get_db_session)):
    """Get the number of users with active WebSocket connections."""
    service = NotificationService(db)
    return {"connected_users": service.get_connected_users_count()}
