"""
Enums matching the PostgreSQL ENUM types from DB schema.
"""
import enum


class UserRole(str, enum.Enum):
    """User role types"""
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"


class ClassState(str, enum.Enum):
    """Class state types"""
    INACTIVE = "inactive"
    ACTIVE = "active"
    COMPLETED = "completed"


class AttendanceStatus(str, enum.Enum):
    """Attendance status types"""
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class NotificationType(str, enum.Enum):
    """Notification types"""
    CLASS_STARTED = "class_started"
    ATTENDANCE_MARKED = "attendance_marked"
    ANNOUNCEMENT = "announcement"


class WeekDay(str, enum.Enum):
    """Days of the week"""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"
