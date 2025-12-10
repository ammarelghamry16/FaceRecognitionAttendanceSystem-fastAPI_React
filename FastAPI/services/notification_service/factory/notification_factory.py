"""
Notification Factory implementing Factory pattern.
Creates different types of notifications with appropriate content.
"""
from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from ..models.notification import Notification


class NotificationFactory:
    """
    Factory class for creating notification objects.
    
    Implements Factory pattern to encapsulate notification creation logic
    and ensure consistent notification formatting across the application.
    """
    
    # Notification type constants
    CLASS_STARTED = "class_started"
    CLASS_ENDED = "class_ended"
    CLASS_CANCELLED = "class_cancelled"
    CLASS_RESCHEDULED = "class_rescheduled"
    ATTENDANCE_CONFIRMED = "attendance_confirmed"
    ATTENDANCE_ABSENT = "attendance_absent"
    ATTENDANCE_LATE = "attendance_late"
    SCHEDULE_UPDATED = "schedule_updated"
    ENROLLMENT_CONFIRMED = "enrollment_confirmed"
    ENROLLMENT_REMOVED = "enrollment_removed"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    
    @classmethod
    def create_notification(
        cls,
        notification_type: str,
        user_id: UUID,
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a notification based on type.
        
        Args:
            notification_type: Type of notification to create
            user_id: ID of the user to notify
            data: Additional data for the notification
            
        Returns:
            Notification object
            
        Raises:
            ValueError: If notification type is unknown
        """
        data = data or {}
        
        factory_methods = {
            cls.CLASS_STARTED: cls._create_class_started,
            cls.CLASS_ENDED: cls._create_class_ended,
            cls.CLASS_CANCELLED: cls._create_class_cancelled,
            cls.CLASS_RESCHEDULED: cls._create_class_rescheduled,
            cls.ATTENDANCE_CONFIRMED: cls._create_attendance_confirmed,
            cls.ATTENDANCE_ABSENT: cls._create_attendance_absent,
            cls.ATTENDANCE_LATE: cls._create_attendance_late,
            cls.SCHEDULE_UPDATED: cls._create_schedule_updated,
            cls.ENROLLMENT_CONFIRMED: cls._create_enrollment_confirmed,
            cls.ENROLLMENT_REMOVED: cls._create_enrollment_removed,
            cls.SYSTEM_ANNOUNCEMENT: cls._create_system_announcement,
        }
        
        factory_method = factory_methods.get(notification_type)
        if not factory_method:
            raise ValueError(f"Unknown notification type: {notification_type}")
        
        return factory_method(user_id, data)
    
    @classmethod
    def _create_class_started(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create class started notification."""
        class_name = data.get("class_name", "Your class")
        room = data.get("room", "")
        
        message = f"{class_name} has started"
        if room:
            message += f" in Room {room}"
        
        return Notification(
            user_id=user_id,
            type=cls.CLASS_STARTED,
            title="Class Started",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_class_ended(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create class ended notification."""
        class_name = data.get("class_name", "Your class")
        
        return Notification(
            user_id=user_id,
            type=cls.CLASS_ENDED,
            title="Class Ended",
            message=f"{class_name} has ended",
            data=data
        )
    
    @classmethod
    def _create_class_cancelled(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create class cancelled notification."""
        class_name = data.get("class_name", "Your class")
        reason = data.get("reason", "")
        
        message = f"{class_name} has been cancelled"
        if reason:
            message += f". Reason: {reason}"
        
        return Notification(
            user_id=user_id,
            type=cls.CLASS_CANCELLED,
            title="Class Cancelled",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_class_rescheduled(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create class rescheduled notification."""
        class_name = data.get("class_name", "Your class")
        new_time = data.get("new_time", "")
        new_room = data.get("new_room", "")
        
        message = f"{class_name} has been rescheduled"
        if new_time:
            message += f" to {new_time}"
        if new_room:
            message += f" in Room {new_room}"
        
        return Notification(
            user_id=user_id,
            type=cls.CLASS_RESCHEDULED,
            title="Class Rescheduled",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_attendance_confirmed(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create attendance confirmed notification."""
        class_name = data.get("class_name", "class")
        confidence = data.get("confidence")
        
        message = f"Your attendance for {class_name} has been marked as present"
        if confidence:
            message += f" (confidence: {confidence:.0%})"
        
        return Notification(
            user_id=user_id,
            type=cls.ATTENDANCE_CONFIRMED,
            title="Attendance Confirmed",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_attendance_absent(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create attendance absent notification."""
        class_name = data.get("class_name", "class")
        
        return Notification(
            user_id=user_id,
            type=cls.ATTENDANCE_ABSENT,
            title="Marked Absent",
            message=f"You have been marked absent for {class_name}",
            data=data
        )
    
    @classmethod
    def _create_attendance_late(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create attendance late notification."""
        class_name = data.get("class_name", "class")
        minutes_late = data.get("minutes_late", 0)
        
        message = f"Your attendance for {class_name} has been marked as late"
        if minutes_late:
            message += f" ({minutes_late} minutes)"
        
        return Notification(
            user_id=user_id,
            type=cls.ATTENDANCE_LATE,
            title="Marked Late",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_schedule_updated(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create schedule updated notification."""
        change_type = data.get("change_type", "updated")
        class_name = data.get("class_name", "A class")
        
        return Notification(
            user_id=user_id,
            type=cls.SCHEDULE_UPDATED,
            title="Schedule Updated",
            message=f"{class_name} has been {change_type}",
            data=data
        )
    
    @classmethod
    def _create_enrollment_confirmed(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create enrollment confirmed notification."""
        class_name = data.get("class_name", "a class")
        course_name = data.get("course_name", "")
        
        message = f"You have been enrolled in {class_name}"
        if course_name:
            message += f" ({course_name})"
        
        return Notification(
            user_id=user_id,
            type=cls.ENROLLMENT_CONFIRMED,
            title="Enrollment Confirmed",
            message=message,
            data=data
        )
    
    @classmethod
    def _create_enrollment_removed(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create enrollment removed notification."""
        class_name = data.get("class_name", "a class")
        
        return Notification(
            user_id=user_id,
            type=cls.ENROLLMENT_REMOVED,
            title="Enrollment Removed",
            message=f"You have been unenrolled from {class_name}",
            data=data
        )
    
    @classmethod
    def _create_system_announcement(cls, user_id: UUID, data: Dict[str, Any]) -> Notification:
        """Create system announcement notification."""
        title = data.get("title", "System Announcement")
        message = data.get("message", "You have a new system announcement")
        
        return Notification(
            user_id=user_id,
            type=cls.SYSTEM_ANNOUNCEMENT,
            title=title,
            message=message,
            data=data
        )
    
    @classmethod
    def get_supported_types(cls) -> list:
        """Get list of supported notification types."""
        return [
            cls.CLASS_STARTED,
            cls.CLASS_ENDED,
            cls.CLASS_CANCELLED,
            cls.CLASS_RESCHEDULED,
            cls.ATTENDANCE_CONFIRMED,
            cls.ATTENDANCE_ABSENT,
            cls.ATTENDANCE_LATE,
            cls.SCHEDULE_UPDATED,
            cls.ENROLLMENT_CONFIRMED,
            cls.ENROLLMENT_REMOVED,
            cls.SYSTEM_ANNOUNCEMENT,
        ]
