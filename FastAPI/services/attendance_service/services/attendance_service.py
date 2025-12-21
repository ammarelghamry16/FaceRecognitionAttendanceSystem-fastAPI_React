"""
Attendance Service - Main business logic orchestrator.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import logging

from ..repositories.session_repository import SessionRepository
from ..repositories.attendance_repository import AttendanceRepository
from ..models.attendance_session import AttendanceSession
from ..models.attendance_record import AttendanceRecord
from ..state_machine import SessionContext

logger = logging.getLogger(__name__)


class AttendanceService:
    """
    Main attendance service handling session and record management.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.session_repo = SessionRepository(db)
        self.attendance_repo = AttendanceRepository(db)
    
    # ==================== Session Management ====================
    
    def start_session(
        self,
        class_id: UUID,
        started_by: UUID,
        late_threshold_minutes: int = 15
    ) -> AttendanceSession:
        """
        Start a new attendance session for a class.
        
        Raises:
            ValueError: If class already has an active session
        """
        # Check for existing active session
        if self.session_repo.has_active_session(class_id):
            raise ValueError("Class already has an active attendance session")
        
        # Create new session
        session = AttendanceSession(
            class_id=class_id,
            started_by=started_by,
            late_threshold_minutes=late_threshold_minutes,
            state="active",
            start_time=datetime.now(timezone.utc)
        )
        
        created_session = self.session_repo.create(session)
        
        # Notify enrolled students that session has started
        self._notify_session_started(created_session)
        
        return created_session
    
    def _notify_session_started(self, session: AttendanceSession) -> None:
        """Notify enrolled students that attendance session has started."""
        try:
            from services.notification_service.services.notification_service import NotificationService
            from services.schedule_service.repositories.enrollment_repository import EnrollmentRepository
            
            notification_service = NotificationService(self.db)
            enrollment_repo = EnrollmentRepository(self.db)
            
            # Get enrolled students for this class
            enrollments = enrollment_repo.find_by_class(session.class_id)
            
            for enrollment in enrollments:
                notification_service.create_notification(
                    user_id=enrollment.student_id,
                    notification_type="session_started",
                    title="Attendance Session Started",
                    message="An attendance session has started for your class. Please mark your attendance.",
                    data={
                        "session_id": str(session.id),
                        "class_id": str(session.class_id)
                    }
                )
            
            logger.info(f"Session start notifications sent to {len(enrollments)} students")
        except Exception as e:
            logger.error(f"Failed to send session start notifications: {e}")
    
    def end_session(
        self,
        session_id: UUID,
        ended_by: Optional[UUID] = None,
        auto_ended: bool = False,
        ended_reason: Optional[str] = None
    ) -> Optional[AttendanceSession]:
        """
        End an active attendance session.
        
        Args:
            session_id: ID of the session to end
            ended_by: ID of the user who ended the session (None for auto-end)
            auto_ended: Whether the session was auto-ended due to duration
            ended_reason: Reason for ending the session
        """
        session = self.session_repo.find_by_id(session_id)
        if not session:
            return None
        
        context = SessionContext(session)
        if context.can_deactivate():
            context.deactivate()
            session.ended_by = ended_by
            
            # Set auto-end fields if applicable
            if hasattr(session, 'auto_ended'):
                session.auto_ended = auto_ended
            if hasattr(session, 'ended_reason') and ended_reason:
                session.ended_reason = ended_reason
            
            self.db.flush()
            self.db.refresh(session)
            
            # Notify enrolled students that session has ended
            self._notify_session_ended(session, ended_by, auto_ended)
        
        return session
    
    def _notify_session_ended(
        self,
        session: AttendanceSession,
        ended_by: Optional[UUID],
        auto_ended: bool
    ) -> None:
        """
        Notify enrolled students that attendance session has ended.
        
        Args:
            session: The session that ended
            ended_by: ID of the user who ended the session
            auto_ended: Whether the session was auto-ended
        """
        try:
            from services.notification_service.services.notification_service import NotificationService
            from services.schedule_service.repositories.enrollment_repository import EnrollmentRepository
            from services.auth_service.repositories.user_repository import UserRepository
            
            notification_service = NotificationService(self.db)
            enrollment_repo = EnrollmentRepository(self.db)
            
            # Get enrolled students for this class
            enrollments = enrollment_repo.find_by_class(session.class_id)
            
            # Determine who ended the session
            if auto_ended:
                ended_by_name = "auto (duration expired)"
            elif ended_by:
                try:
                    user_repo = UserRepository(self.db)
                    user = user_repo.find_by_id(ended_by)
                    ended_by_name = user.full_name if user else "the mentor"
                except Exception:
                    ended_by_name = "the mentor"
            else:
                ended_by_name = "the mentor"
            
            for enrollment in enrollments:
                notification_service.create_notification(
                    user_id=enrollment.student_id,
                    notification_type="class_ended",
                    title="Attendance Session Ended",
                    message=f"The attendance session has ended. Ended by: {ended_by_name}",
                    data={
                        "session_id": str(session.id),
                        "class_id": str(session.class_id),
                        "ended_by": str(ended_by) if ended_by else None,
                        "ended_by_name": ended_by_name,
                        "auto_ended": auto_ended
                    }
                )
            
            logger.info(f"Session end notifications sent to {len(enrollments)} students")
        except Exception as e:
            logger.error(f"Failed to send session end notifications: {e}")
    
    def cancel_session(self, session_id: UUID) -> Optional[AttendanceSession]:
        """Cancel an attendance session."""
        session = self.session_repo.find_by_id(session_id)
        if not session:
            return None
        
        context = SessionContext(session)
        context.cancel()
        self.db.flush()
        self.db.refresh(session)
        return session
    
    def get_session(self, session_id: UUID) -> Optional[AttendanceSession]:
        """Get session by ID."""
        return self.session_repo.find_by_id(session_id)
    
    def get_active_session(self, class_id: UUID) -> Optional[AttendanceSession]:
        """Get active session for a class."""
        return self.session_repo.find_active_by_class(class_id)
    
    def get_class_sessions(
        self, class_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AttendanceSession]:
        """Get all sessions for a class."""
        return self.session_repo.find_by_class(class_id, skip, limit)
    
    # ==================== Attendance Marking ====================
    
    def mark_attendance(
        self,
        session_id: UUID,
        student_id: UUID,
        status: str = "present",
        confidence: Optional[float] = None,
        method: str = "face_recognition",
        marked_by: Optional[UUID] = None,
        reason: Optional[str] = None
    ) -> Optional[AttendanceRecord]:
        """
        Mark attendance for a student.
        """
        session = self.session_repo.find_by_id(session_id)
        if not session:
            raise ValueError("Session not found")
        
        context = SessionContext(session)
        if not context.can_mark_attendance():
            raise ValueError(f"Cannot mark attendance - session is {session.state}")
        
        # Check if late
        if status == "present" and session.late_threshold_minutes:
            elapsed = (datetime.now(timezone.utc) - session.start_time).total_seconds() / 60
            if elapsed > session.late_threshold_minutes:
                status = "late"
        
        # Find or create record
        record = self.attendance_repo.find_by_session_and_student(session_id, student_id)
        now = datetime.now(timezone.utc)
        
        if record:
            record.status = status
            record.marked_at = now
            record.confidence_score = confidence
            record.verification_method = method
            if marked_by:
                record.is_manual_override = True
                record.overridden_by = marked_by
                record.override_reason = reason
        else:
            record = AttendanceRecord(
                session_id=session_id,
                student_id=student_id,
                status=status,
                marked_at=now,
                confidence_score=confidence,
                verification_method=method,
                is_manual_override=marked_by is not None,
                overridden_by=marked_by,
                override_reason=reason
            )
            self.db.add(record)
        
        self.db.flush()
        self.db.refresh(record)
        
        # Trigger notification for attendance marked
        self._notify_attendance_marked(record, session)
        
        return record
    
    def _notify_attendance_marked(
        self,
        record: AttendanceRecord,
        session: AttendanceSession
    ) -> None:
        """Send notification when attendance is marked."""
        try:
            from services.notification_service.services.notification_service import NotificationService
            notification_service = NotificationService(self.db)
            
            # Determine notification type based on status
            if record.status == "present":
                notification_type = "attendance_marked"
                title = "Attendance Recorded"
                message = "Your attendance has been marked as present."
            elif record.status == "late":
                notification_type = "attendance_late"
                title = "Late Attendance"
                message = "Your attendance has been marked as late."
            elif record.status == "absent":
                notification_type = "attendance_absent"
                title = "Marked Absent"
                message = "You have been marked absent for this session."
            else:
                notification_type = "attendance_marked"
                title = "Attendance Updated"
                message = f"Your attendance status: {record.status}"
            
            notification_service.create_notification(
                user_id=record.student_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data={
                    "session_id": str(session.id),
                    "class_id": str(session.class_id),
                    "status": record.status,
                    "method": record.verification_method,
                    "marked_at": record.marked_at.isoformat() if record.marked_at else None
                }
            )
            logger.info(f"Notification sent for attendance: {record.student_id}")
        except Exception as e:
            # Don't fail attendance marking if notification fails
            logger.error(f"Failed to send attendance notification: {e}")
    
    def mark_manual(
        self,
        session_id: UUID,
        student_id: UUID,
        status: str,
        marked_by: UUID,
        reason: Optional[str] = None
    ) -> AttendanceRecord:
        """Mark attendance manually (by mentor)."""
        return self.mark_attendance(
            session_id=session_id,
            student_id=student_id,
            status=status,
            method="manual",
            marked_by=marked_by,
            reason=reason
        )
    
    def process_recognition(
        self,
        session_id: UUID,
        student_id: UUID,
        confidence: float
    ) -> AttendanceRecord:
        """
        Process face recognition result from AI service.
        
        Face recognition is only allowed within the auto-recognition window.
        After the window expires, only manual marking is allowed.
        
        Raises:
            ValueError: If session not found or recognition window has expired
        """
        session = self.session_repo.find_by_id(session_id)
        if not session:
            raise ValueError("Session not found")
        
        # Check if auto-recognition is still active
        if not session.is_auto_recognition_active:
            raise ValueError(
                f"Auto-recognition window has expired. "
                f"Session started {session.get_duration_minutes()} minutes ago, "
                f"window is {session.auto_recognition_window_minutes} minutes. "
                f"Please use manual attendance marking."
            )
        
        return self.mark_attendance(
            session_id=session_id,
            student_id=student_id,
            status="present",
            confidence=confidence,
            method="face_recognition"
        )
    
    # ==================== Queries ====================
    
    def get_session_records(self, session_id: UUID) -> List[AttendanceRecord]:
        """Get all attendance records for a session."""
        return self.attendance_repo.find_by_session(session_id)
    
    def get_student_history(
        self, student_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AttendanceRecord]:
        """Get attendance history for a student."""
        return self.attendance_repo.find_by_student(student_id, skip, limit)
    
    def get_session_stats(self, session_id: UUID) -> Dict[str, Any]:
        """Get attendance statistics for a session."""
        return self.attendance_repo.get_session_stats(session_id)
    
    def get_student_stats(self, student_id: UUID) -> Dict[str, Any]:
        """Get attendance statistics for a student."""
        records = self.attendance_repo.find_by_student(student_id, limit=1000)
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        late = sum(1 for r in records if r.status == "late")
        absent = sum(1 for r in records if r.status == "absent")
        
        return {
            "total_sessions": total,
            "present": present,
            "late": late,
            "absent": absent,
            "attendance_rate": (present + late) / total if total > 0 else 0.0
        }
    
    def get_recognition_window_status(self, session_id: UUID) -> Dict[str, Any]:
        """
        Get the auto-recognition window status for a session.
        
        Returns:
            Dict with:
            - is_active: Whether auto-recognition is currently active
            - elapsed_minutes: Minutes since session started
            - window_minutes: Total window duration
            - remaining_minutes: Minutes remaining in window (0 if expired)
            - mode: "auto" or "manual_only"
        """
        session = self.session_repo.find_by_id(session_id)
        if not session:
            raise ValueError("Session not found")
        
        elapsed = session.get_duration_minutes()
        window = session.auto_recognition_window_minutes
        remaining = max(0, window - elapsed)
        is_active = session.is_auto_recognition_active
        
        return {
            "is_active": is_active,
            "elapsed_minutes": elapsed,
            "window_minutes": window,
            "remaining_minutes": remaining,
            "mode": "auto" if is_active else "manual_only"
        }
