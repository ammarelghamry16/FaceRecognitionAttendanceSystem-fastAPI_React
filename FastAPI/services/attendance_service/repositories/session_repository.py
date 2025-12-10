"""
Session Repository for attendance session data access.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.attendance_session import AttendanceSession


class SessionRepository:
    """Repository for AttendanceSession data access."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, session: AttendanceSession) -> AttendanceSession:
        """Create a new attendance session."""
        self.db.add(session)
        self.db.flush()
        self.db.refresh(session)
        return session
    
    def find_by_id(self, session_id: UUID) -> Optional[AttendanceSession]:
        """Find session by ID."""
        return self.db.query(AttendanceSession).filter(
            AttendanceSession.id == session_id
        ).first()
    
    def find_active_by_class(self, class_id: UUID) -> Optional[AttendanceSession]:
        """Find active session for a class."""
        return self.db.query(AttendanceSession).filter(
            and_(
                AttendanceSession.class_id == class_id,
                AttendanceSession.state == "active"
            )
        ).first()
    
    def find_by_class(self, class_id: UUID, skip: int = 0, limit: int = 100) -> List[AttendanceSession]:
        """Find all sessions for a class."""
        return self.db.query(AttendanceSession).filter(
            AttendanceSession.class_id == class_id
        ).order_by(AttendanceSession.start_time.desc()).offset(skip).limit(limit).all()
    
    def find_active_sessions(self) -> List[AttendanceSession]:
        """Find all currently active sessions."""
        return self.db.query(AttendanceSession).filter(
            AttendanceSession.state == "active"
        ).all()
    
    def update(self, session_id: UUID, **kwargs) -> Optional[AttendanceSession]:
        """Update session fields."""
        session = self.find_by_id(session_id)
        if not session:
            return None
        for key, value in kwargs.items():
            if hasattr(session, key) and value is not None:
                setattr(session, key, value)
        self.db.flush()
        self.db.refresh(session)
        return session
    
    def end_session(self, session_id: UUID, ended_by: Optional[UUID] = None) -> Optional[AttendanceSession]:
        """End an active session."""
        session = self.find_by_id(session_id)
        if session and session.state == "active":
            session.state = "completed"
            session.end_time = datetime.now(timezone.utc)
            session.ended_by = ended_by
            self.db.flush()
            self.db.refresh(session)
        return session
    
    def has_active_session(self, class_id: UUID) -> bool:
        """Check if class has an active session."""
        return self.find_active_by_class(class_id) is not None
