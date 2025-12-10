"""
Attendance Repository for attendance record data access.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..models.attendance_record import AttendanceRecord


class AttendanceRepository:
    """Repository for AttendanceRecord data access."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, record: AttendanceRecord) -> AttendanceRecord:
        """Create a new attendance record."""
        self.db.add(record)
        self.db.flush()
        self.db.refresh(record)
        return record
    
    def find_by_id(self, record_id: UUID) -> Optional[AttendanceRecord]:
        """Find record by ID."""
        return self.db.query(AttendanceRecord).filter(
            AttendanceRecord.id == record_id
        ).first()
    
    def find_by_session_and_student(
        self, session_id: UUID, student_id: UUID
    ) -> Optional[AttendanceRecord]:
        """Find record for specific student in session."""
        return self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.student_id == student_id
            )
        ).first()
    
    def find_by_session(self, session_id: UUID) -> List[AttendanceRecord]:
        """Find all records for a session."""
        return self.db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session_id
        ).all()
    
    def find_by_student(
        self, student_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[AttendanceRecord]:
        """Find all records for a student."""
        return self.db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id
        ).order_by(AttendanceRecord.created_at.desc()).offset(skip).limit(limit).all()
    
    def update(self, record_id: UUID, **kwargs) -> Optional[AttendanceRecord]:
        """Update record fields."""
        record = self.find_by_id(record_id)
        if not record:
            return None
        for key, value in kwargs.items():
            if hasattr(record, key):
                setattr(record, key, value)
        self.db.flush()
        self.db.refresh(record)
        return record
    
    def mark_present(
        self,
        session_id: UUID,
        student_id: UUID,
        confidence: Optional[float] = None,
        method: str = "face_recognition"
    ) -> AttendanceRecord:
        """Mark student as present, create or update record."""
        record = self.find_by_session_and_student(session_id, student_id)
        now = datetime.now(timezone.utc)
        
        if record:
            record.status = "present"
            record.marked_at = now
            record.confidence_score = confidence
            record.verification_method = method
        else:
            record = AttendanceRecord(
                session_id=session_id,
                student_id=student_id,
                status="present",
                marked_at=now,
                confidence_score=confidence,
                verification_method=method
            )
            self.db.add(record)
        
        self.db.flush()
        self.db.refresh(record)
        return record
    
    def get_session_stats(self, session_id: UUID) -> Dict[str, int]:
        """Get attendance statistics for a session."""
        records = self.find_by_session(session_id)
        stats = {"present": 0, "absent": 0, "late": 0, "excused": 0, "total": len(records)}
        for r in records:
            if r.status in stats:
                stats[r.status] += 1
        return stats
