"""
FastAPI routes for AI Service (Face Recognition).
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from shared.database.connection import get_db_session
from shared.models.user import User
from services.auth_service.api.dependencies import (
    get_current_active_user,
    require_role
)
from ..services.recognition_service import RecognitionService
from ..schemas.response import (
    EnrollmentResponse,
    RecognitionResponse,
    FaceEncodingResponse,
    UserEnrollmentStatus
)

router = APIRouter()


# ==================== Enrollment Endpoints ====================

@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_face(
    user_id: UUID = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Enroll a single face image for a user.
    Admin only - used to register student faces.
    """
    content = await image.read()
    
    service = RecognitionService(db)
    result = service.enroll_face(
        user_id=user_id,
        image_bytes=content,
        source_path=image.filename
    )
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return EnrollmentResponse(
        success=result.success,
        user_id=result.user_id,
        encodings_count=result.encodings_count,
        message=result.message
    )


@router.post("/enroll/multiple", response_model=EnrollmentResponse)
async def enroll_multiple_faces(
    user_id: UUID = Form(...),
    images: List[UploadFile] = File(...),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Enroll multiple face images for a user.
    Recommended: 3-5 images from different angles.
    """
    if len(images) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per request"
        )
    
    image_bytes = []
    for img in images:
        content = await img.read()
        image_bytes.append(content)
    
    service = RecognitionService(db)
    result = service.enroll_multiple(user_id, image_bytes)
    
    return EnrollmentResponse(
        success=result.success,
        user_id=result.user_id,
        encodings_count=result.encodings_count,
        message=result.message
    )


# ==================== Recognition Endpoints ====================

@router.post("/recognize", response_model=RecognitionResponse)
async def recognize_face(
    image: UploadFile = File(...),
    db: Session = Depends(get_db_session)
):
    """
    Recognize a face from an uploaded image.
    
    This endpoint is used by the Edge Agent to identify students.
    Returns the matched user_id and confidence score.
    """
    content = await image.read()
    
    service = RecognitionService(db)
    result = service.recognize_face(content)
    
    return RecognitionResponse(
        recognized=result.matched,
        user_id=UUID(result.user_id) if result.user_id else None,
        confidence=result.confidence,
        distance=result.distance,
        message=result.message
    )


@router.post("/recognize/attendance/{session_id}")
async def recognize_for_attendance(
    session_id: UUID,
    image: UploadFile = File(...),
    db: Session = Depends(get_db_session)
):
    """
    Recognize face and mark attendance in one call.
    
    Used by Edge Agent during active attendance sessions.
    """
    content = await image.read()
    
    # Recognize face
    service = RecognitionService(db)
    result = service.recognize_face(content)
    
    if not result.matched:
        return {
            "recognized": False,
            "attendance_marked": False,
            "message": result.message
        }
    
    # Mark attendance
    from services.attendance_service.services import AttendanceService
    attendance_service = AttendanceService(db)
    
    try:
        record = attendance_service.process_recognition(
            session_id=session_id,
            student_id=UUID(result.user_id),
            confidence=result.confidence
        )
        
        return {
            "recognized": True,
            "attendance_marked": True,
            "user_id": result.user_id,
            "confidence": result.confidence,
            "status": record.status
        }
    except ValueError as e:
        return {
            "recognized": True,
            "attendance_marked": False,
            "user_id": result.user_id,
            "confidence": result.confidence,
            "message": str(e)
        }


# ==================== Management Endpoints ====================

@router.get("/enrollment/status/{user_id}", response_model=UserEnrollmentStatus)
def get_enrollment_status(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Check if a user has enrolled face data."""
    service = RecognitionService(db)
    
    return UserEnrollmentStatus(
        user_id=user_id,
        is_enrolled=service.is_user_enrolled(user_id),
        encodings_count=service.get_user_encodings_count(user_id)
    )


@router.delete("/enrollment/{user_id}")
def delete_user_enrollment(
    user_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db_session)
):
    """Delete all face encodings for a user (admin only)."""
    service = RecognitionService(db)
    count = service.delete_user_encodings(user_id)
    
    return {
        "deleted_count": count,
        "message": f"Deleted {count} encodings for user {user_id}"
    }
