"""
Stats Service - Business logic for aggregated statistics.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import Dict, Any

from shared.models.user import User
from services.schedule_service.models.course import Course
from services.schedule_service.models.class_model import Class
from services.schedule_service.models.enrollment import Enrollment
from services.attendance_service.models.attendance_session import AttendanceSession
from services.attendance_service.models.attendance_record import AttendanceRecord


class StatsService:
    """Service for computing aggregated statistics."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get aggregated dashboard statistics."""
        # Count users by role
        total_students = self.db.query(func.count(User.id)).filter(
            User.role == 'student', User.is_active == True
        ).scalar() or 0
        
        total_mentors = self.db.query(func.count(User.id)).filter(
            User.role == 'mentor', User.is_active == True
        ).scalar() or 0
        
        total_admins = self.db.query(func.count(User.id)).filter(
            User.role == 'admin', User.is_active == True
        ).scalar() or 0
        
        # Count courses and classes
        total_courses = self.db.query(func.count(Course.id)).scalar() or 0
        total_classes = self.db.query(func.count(Class.id)).scalar() or 0
        
        # Count active sessions
        active_sessions = self.db.query(func.count(AttendanceSession.id)).filter(
            AttendanceSession.state == 'active'
        ).scalar() or 0
        
        # Today's stats
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        today_sessions = self.db.query(func.count(AttendanceSession.id)).filter(
            AttendanceSession.start_time >= today_start,
            AttendanceSession.start_time < today_end
        ).scalar() or 0
        
        today_attendance_count = self.db.query(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.marked_at >= today_start,
            AttendanceRecord.marked_at < today_end,
            AttendanceRecord.status.in_(['present', 'late'])
        ).scalar() or 0
        
        # Overall attendance rate
        total_records = self.db.query(func.count(AttendanceRecord.id)).scalar() or 0
        present_records = self.db.query(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.status.in_(['present', 'late'])
        ).scalar() or 0
        
        overall_attendance_rate = (present_records / total_records * 100) if total_records > 0 else 0.0
        
        return {
            "total_courses": total_courses,
            "total_classes": total_classes,
            "total_students": total_students,
            "total_mentors": total_mentors,
            "total_admins": total_admins,
            "active_sessions": active_sessions,
            "overall_attendance_rate": round(overall_attendance_rate, 1),
            "today_sessions": today_sessions,
            "today_attendance_count": today_attendance_count
        }
    
    def get_student_stats(self, student_id: UUID) -> Dict[str, Any]:
        """Get attendance statistics for a specific student."""
        # Get all attendance records for this student
        records = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id
        ).all()
        
        total_sessions = len(records)
        present = sum(1 for r in records if r.status == 'present')
        late = sum(1 for r in records if r.status == 'late')
        absent = sum(1 for r in records if r.status == 'absent')
        excused = sum(1 for r in records if r.status == 'excused')
        
        # Attendance rate = (present + late) / total
        attendance_rate = ((present + late) / total_sessions * 100) if total_sessions > 0 else 0.0
        
        return {
            "student_id": str(student_id),
            "total_sessions": total_sessions,
            "present": present,
            "late": late,
            "absent": absent,
            "excused": excused,
            "attendance_rate": round(attendance_rate, 1)
        }
    
    def get_class_stats(self, class_id: UUID) -> Dict[str, Any]:
        """Get attendance statistics for a specific class."""
        # Get class info
        class_obj = self.db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            return None
        
        # Count enrolled students
        total_enrolled = self.db.query(func.count(Enrollment.student_id)).filter(
            Enrollment.class_id == class_id
        ).scalar() or 0
        
        # Get all sessions for this class
        sessions = self.db.query(AttendanceSession).filter(
            AttendanceSession.class_id == class_id
        ).all()
        
        total_sessions = len(sessions)
        
        # Calculate average attendance rate across all sessions
        if total_sessions > 0 and total_enrolled > 0:
            total_present = 0
            total_expected = 0
            
            for session in sessions:
                records = self.db.query(AttendanceRecord).filter(
                    AttendanceRecord.session_id == session.id
                ).all()
                
                present_count = sum(1 for r in records if r.status in ['present', 'late'])
                total_present += present_count
                total_expected += total_enrolled
            
            average_attendance_rate = (total_present / total_expected * 100) if total_expected > 0 else 0.0
        else:
            average_attendance_rate = 0.0
        
        return {
            "class_id": str(class_id),
            "class_name": class_obj.name,
            "total_sessions": total_sessions,
            "total_enrolled": total_enrolled,
            "average_attendance_rate": round(average_attendance_rate, 1)
        }
    
    def get_user_count(self) -> Dict[str, int]:
        """Get count of users by role."""
        students = self.db.query(func.count(User.id)).filter(
            User.role == 'student', User.is_active == True
        ).scalar() or 0
        
        mentors = self.db.query(func.count(User.id)).filter(
            User.role == 'mentor', User.is_active == True
        ).scalar() or 0
        
        admins = self.db.query(func.count(User.id)).filter(
            User.role == 'admin', User.is_active == True
        ).scalar() or 0
        
        total = students + mentors + admins
        
        return {
            "total": total,
            "students": students,
            "mentors": mentors,
            "admins": admins
        }
