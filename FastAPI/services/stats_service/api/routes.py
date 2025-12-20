"""
FastAPI routes for Stats Service.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from shared.database.connection import get_db_session
from shared.models.user import User
from services.auth_service.api.dependencies import (
    get_current_active_user,
    require_role
)
from ..services.stats_service import StatsService
from ..schemas.response import (
    DashboardStatsResponse,
    StudentStatsResponse,
    ClassStatsResponse
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get aggregated dashboard statistics.
    Available to all authenticated users.
    """
    service = StatsService(db)
    stats = service.get_dashboard_stats()
    return DashboardStatsResponse(**stats)


@router.get("/student/{student_id}", response_model=StudentStatsResponse)
def get_student_stats(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get attendance statistics for a specific student.
    Students can only view their own stats.
    """
    # Students can only view their own stats
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    service = StatsService(db)
    stats = service.get_student_stats(student_id)
    return StudentStatsResponse(**stats)


@router.get("/class/{class_id}", response_model=ClassStatsResponse)
def get_class_stats(
    class_id: UUID,
    current_user: User = Depends(require_role(["mentor", "admin"])),
    db: Session = Depends(get_db_session)
):
    """
    Get attendance statistics for a specific class.
    Only mentors and admins can view class stats.
    """
    service = StatsService(db)
    stats = service.get_class_stats(class_id)
    
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    return ClassStatsResponse(**stats)


@router.get("/users/count")
def get_user_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session)
):
    """
    Get count of users by role.
    Available to all authenticated users.
    """
    service = StatsService(db)
    return service.get_user_count()
