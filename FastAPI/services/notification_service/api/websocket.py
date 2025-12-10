"""
WebSocket endpoint for real-time notifications.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import logging
import json

from shared.database.connection import get_db_session, DatabaseConnection
from ..observer.subject import notification_subject
from ..observer.websocket_observer import WebSocketObserver
from ..services.notification_service import NotificationService

logger = logging.getLogger(__name__)

websocket_router = APIRouter()


@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time notifications.
    
    Clients connect to this endpoint to receive notifications in real-time.
    
    Args:
        websocket: The WebSocket connection
        user_id: The user ID to receive notifications for
        
    Protocol:
        - Client connects with user_id in URL
        - Server sends notifications as JSON messages
        - Client can send "ping" messages to keep connection alive
        - Server responds with "pong" to ping messages
        
    Message format (server -> client):
        {
            "type": "notification",
            "payload": {
                "id": "uuid",
                "type": "class_started",
                "title": "...",
                "message": "...",
                "data": {...},
                "is_read": false,
                "created_at": "iso8601"
            }
        }
    """
    await websocket.accept()
    logger.info(f"WebSocket connection accepted for user {user_id}")
    
    # Create observer for this connection
    observer = WebSocketObserver(websocket, user_id)
    
    # Attach observer to subject
    notification_subject.attach(observer)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "payload": {
                "message": "Connected to notification service",
                "user_id": user_id
            }
        })
        
        # Send unread count on connect
        db_connection = DatabaseConnection()
        session = db_connection.create_session()
        try:
            service = NotificationService(session)
            counts = service.get_notification_counts(user_id)
            await websocket.send_json({
                "type": "unread_count",
                "payload": counts
            })
        finally:
            session.close()
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "payload": {}
                    })
                
                elif message.get("type") == "mark_read":
                    # Client wants to mark notification as read
                    notification_id = message.get("payload", {}).get("notification_id")
                    if notification_id:
                        session = db_connection.create_session()
                        try:
                            service = NotificationService(session)
                            service.mark_as_read(notification_id)
                            session.commit()
                            await websocket.send_json({
                                "type": "marked_read",
                                "payload": {"notification_id": notification_id}
                            })
                        finally:
                            session.close()
                
                elif message.get("type") == "get_unread_count":
                    # Client requests unread count
                    session = db_connection.create_session()
                    try:
                        service = NotificationService(session)
                        counts = service.get_notification_counts(user_id)
                        await websocket.send_json({
                            "type": "unread_count",
                            "payload": counts
                        })
                    finally:
                        session.close()
                
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from user {user_id}")
                await websocket.send_json({
                    "type": "error",
                    "payload": {"message": "Invalid JSON format"}
                })
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Clean up: detach observer
        observer.deactivate()
        notification_subject.detach(observer)
        logger.info(f"WebSocket observer removed for user {user_id}")


@websocket_router.websocket("/ws/test")
async def websocket_test_endpoint(websocket: WebSocket):
    """
    Test WebSocket endpoint for debugging.
    
    Echoes back any message received.
    """
    await websocket.accept()
    logger.info("Test WebSocket connection accepted")
    
    try:
        await websocket.send_json({
            "type": "connected",
            "payload": {"message": "Test WebSocket connected"}
        })
        
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({
                "type": "echo",
                "payload": {"received": data}
            })
            
    except WebSocketDisconnect:
        logger.info("Test WebSocket disconnected")
