"""
FastAPI routes for Attendance Service.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from shared.database.connection import get_db_session
from shared.models.user import User
from services.auth_service.api.dependencies import (
    get_current_active_user,
    require_role
)
from ..services.attendance_service import AttendanceService
from ..schemas.request import (
    StartSessionRequest,
    ManualAttendanceRequest,
    RecognitionResultRequest
)
from ..schemas.response import (
    AttendanceSessionResponse,
    AttendanceRecordResponse,
    SessionStatsResponse
)

router = APIRouter()


# ==================== Session Management ====================

@router.post("/sessions/start", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    request: StartSessionRequest,
    current_user: User = Depends(require_role(["mentor", "admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Start a new attendance session for a class.
    Only mentors and admins can start sessions.
    """
    try:
        service = AttendanceService(db)
        session = service.start_session(
            class_id=request.class_id,
            started_by=current_user.id,
            late_threshold_minutes=request.late_threshold_minutes
        )
        return AttendanceSessionResponse.model_validate(session)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/sessions/{session_id}/end", response_model=AttendanceSessionResponse)
def end_session(
    session_id: UUID,
    current_user: User = Depends(require_role(["mentor", "admin"])),
    db: Session = Depends(get_db_session)
):
    """End an active attendance session."""
    service = AttendanceService(db)
    session = service.end_session(session_id, ended_by=current_user.id)
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return AttendanceSessionResponse.model_validate(session)


@router.post("/sessions/{session_id}/cancel", response_model=AttendanceSessionResponse)
def cancel_session(
    session_id: UUID,
    current_user: User = Depends(require_role(["mentor", "admin"])),
    db: Session = Depends(get_db_session)
):
    """Cancel an attendance session."""
    service = AttendanceService(db)
    session = service.cancel_session(session_id)
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return AttendanceSessionResponse.model_validate(session)


@router.get("/sessions/{session_id}", response_model=AttendanceSessionResponse)
def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get session details."""
    service = AttendanceService(db)
    session = service.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return AttendanceSessionResponse.model_validate(session)


@router.get("/sessions/class/{class_id}/active", response_model=AttendanceSessionResponse)
def get_active_session(
    class_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get active session for a class."""
    service = AttendanceService(db)
    session = service.get_active_session(class_id)
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active session")
    
    return AttendanceSessionResponse.model_validate(session)


@router.get("/sessions/class/{class_id}", response_model=List[AttendanceSessionResponse])
def get_class_sessions(
    class_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get all sessions for a class."""
    service = AttendanceService(db)
    sessions = service.get_class_sessions(class_id)
    return [AttendanceSessionResponse.model_validate(s) for s in sessions]


# ==================== Attendance Marking ====================

@router.post("/mark/manual", response_model=AttendanceRecordResponse)
def mark_manual_attendance(
    request: ManualAttendanceRequest,
    current_user: User = Depends(require_role(["mentor", "admin"])),
    db: Session = Depends(get_db_session)
):
    """Manually mark attendance (mentor/admin only)."""
    try:
        service = AttendanceService(db)
        record = service.mark_manual(
            session_id=request.session_id,
            student_id=request.student_id,
            status=request.status,
            marked_by=current_user.id,
            reason=request.reason
        )
        return AttendanceRecordResponse.model_validate(record)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/internal/recognize", response_model=AttendanceRecordResponse)
def process_recognition(
    request: RecognitionResultRequest,
    db: Session = Depends(get_db_session)
):
    """
    Internal endpoint for AI service to submit recognition results.
    Note: In production, this should be protected by API key auth.
    """
    try:
        service = AttendanceService(db)
        record = service.process_recognition(
            session_id=request.session_id,
            student_id=request.student_id,
            confidence=request.confidence
        )
        return AttendanceRecordResponse.model_validate(record)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== Queries ====================

@router.get("/sessions/{session_id}/records", response_model=List[AttendanceRecordResponse])
def get_session_records(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get all attendance records for a session."""
    service = AttendanceService(db)
    records = service.get_session_records(session_id)
    return [AttendanceRecordResponse.model_validate(r) for r in records]


@router.get("/sessions/{session_id}/stats")
def get_session_stats(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get attendance statistics for a session."""
    service = AttendanceService(db)
    return service.get_session_stats(session_id)


@router.get("/history/student/{student_id}", response_model=List[AttendanceRecordResponse])
def get_student_history(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get attendance history for a student."""
    # Students can only view their own history
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    service = AttendanceService(db)
    records = service.get_student_history(student_id)
    return [AttendanceRecordResponse.model_validate(r) for r in records]


@router.get("/history/student/{student_id}/stats")
def get_student_stats(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Get attendance statistics for a student."""
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    service = AttendanceService(db)
    return service.get_student_stats(student_id)


@router.get("/sessions/{session_id}/recognition-window")
def get_recognition_window_status(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get the auto-recognition window status for a session.
    
    Returns:
    - is_active: Whether auto-recognition is currently active
    - elapsed_minutes: Minutes since session started
    - window_minutes: Total window duration
    - remaining_minutes: Minutes remaining in window (0 if expired)
    - mode: "auto" or "manual_only"
    """
    try:
        service = AttendanceService(db)
        return service.get_recognition_window_status(session_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/sessions/active")
def get_all_active_sessions(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Get all currently active sessions (admin only).
    Used for admin multi-session spectating view.
    """
    from ..repositories.session_repository import SessionRepository
    session_repo = SessionRepository(db)
    sessions = session_repo.find_active_sessions()
    return [AttendanceSessionResponse.model_validate(s) for s in sessions]
