"""
FastAPI routes for AI Service (Face Recognition).
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import logging

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
    UserEnrollmentStatus,
    EnrollmentMetricsResponse
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Enrollment Endpoints ====================

@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_face(
    user_id: UUID = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Enroll a single face image for a user.
    Users can enroll their own face, admins can enroll any user.
    """
    logger.info(f"📸 ENROLL_FACE: user_id={user_id}, current_user={current_user.id} ({current_user.role}), filename={image.filename}")
    
    # Check authorization: user can enroll themselves, admin can enroll anyone
    if str(current_user.id) != str(user_id) and current_user.role != "admin":
        logger.warning(f"❌ ENROLL_FACE: Authorization failed - user {current_user.id} cannot enroll {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only enroll your own face"
        )
    content = await image.read()
    logger.info(f"📸 ENROLL_FACE: Image size={len(content)} bytes")
    
    service = RecognitionService(db)
    result = service.enroll_face(
        user_id=user_id,
        image_bytes=content,
        source_path=image.filename
    )
    
    logger.info(f"📸 ENROLL_FACE: Result success={result.success}, message={result.message}, quality={result.quality_score:.2f}")
    
    if not result.success:
        logger.warning(f"❌ ENROLL_FACE: Failed - {result.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    logger.info(f"✅ ENROLL_FACE: Success - encodings_count={result.encodings_count}, pose={result.pose_category}")
    return EnrollmentResponse(
        success=result.success,
        user_id=result.user_id,
        encodings_count=result.encodings_count,
        message=result.message,
        quality_score=result.quality_score,
        pose_category=result.pose_category
    )


@router.post("/enroll/multiple", response_model=EnrollmentResponse)
async def enroll_multiple_faces(
    user_id: UUID = Form(...),
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Enroll multiple face images for a user.
    Users can enroll their own face, admins can enroll any user.
    Recommended: 3-5 images from different angles.
    """
    logger.info(f"📸 ENROLL_MULTIPLE: user_id={user_id}, current_user={current_user.id} ({current_user.role}), image_count={len(images)}")
    
    # Check authorization: user can enroll themselves, admin can enroll anyone
    if str(current_user.id) != str(user_id) and current_user.role != "admin":
        logger.warning(f"❌ ENROLL_MULTIPLE: Authorization failed - user {current_user.id} cannot enroll {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only enroll your own face"
        )
    if len(images) > 10:
        logger.warning(f"❌ ENROLL_MULTIPLE: Too many images ({len(images)} > 10)")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per request"
        )
    
    image_bytes = []
    for i, img in enumerate(images):
        content = await img.read()
        image_bytes.append(content)
        logger.info(f"📸 ENROLL_MULTIPLE: Image {i} size={len(content)} bytes, filename={img.filename}")
    
    service = RecognitionService(db)
    result = service.enroll_multiple(user_id, image_bytes)
    
    logger.info(f"📸 ENROLL_MULTIPLE: Result success={result.success}, message={result.message}, encodings={result.encodings_count}")
    
    if not result.success:
        logger.warning(f"❌ ENROLL_MULTIPLE: Failed - {result.message}")
    else:
        logger.info(f"✅ ENROLL_MULTIPLE: Success - {result.encodings_count}/{len(images)} enrolled")
    
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """Delete all face encodings for a user. Users can delete their own, admins can delete any."""
    # Check authorization: user can delete their own, admin can delete anyone
    if str(current_user.id) != str(user_id) and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own face enrollment"
        )
    service = RecognitionService(db)
    count = service.delete_user_encodings(user_id)
    
    return {
        "deleted_count": count,
        "message": f"Deleted {count} encodings for user {user_id}"
    }


@router.get("/enrollment/metrics/{user_id}", response_model=EnrollmentMetricsResponse)
def get_enrollment_metrics(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get detailed enrollment quality metrics for a user.
    
    Returns:
    - encoding_count: Number of enrolled face images
    - avg_quality_score: Average quality score (0.0-1.0)
    - pose_coverage: List of captured pose categories
    - needs_re_enrollment: Whether user should re-enroll
    - re_enrollment_reason: Reason for re-enrollment recommendation
    """
    service = RecognitionService(db)
    metrics = service.get_enrollment_metrics(user_id)
    
    return EnrollmentMetricsResponse(
        user_id=metrics.user_id,
        encoding_count=metrics.encoding_count,
        avg_quality_score=metrics.avg_quality_score,
        pose_coverage=metrics.pose_coverage,
        needs_re_enrollment=metrics.needs_re_enrollment,
        re_enrollment_reason=metrics.re_enrollment_reason,
        last_updated=metrics.last_updated
    )


@router.get("/status")
def get_ai_service_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get AI service status including model info and concurrency settings.
    
    Returns:
    - model_loaded: Whether the model is loaded
    - execution_provider: CPU, CUDA, DirectML, or CoreML
    - max_concurrent_requests: Maximum concurrent inference requests
    - prefer_gpu: Whether GPU is preferred
    """
    from ..adapters import get_best_available_adapter
    
    try:
        adapter = get_best_available_adapter()
        return adapter.get_status()
    except ImportError as e:
        return {
            "model_loaded": False,
            "error": str(e),
            "message": "No face recognition library available"
        }
