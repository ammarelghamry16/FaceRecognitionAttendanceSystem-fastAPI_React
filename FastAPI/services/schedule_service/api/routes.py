"""
FastAPI routes for schedule service.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from shared.database.connection import get_db_session
from ..services import ScheduleService, EnrollmentService
from ..schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    ClassCreate, ClassUpdate, ClassResponse, ClassDetailResponse,
    EnrollmentCreate, EnrollmentResponse,
    ScheduleResponse
)
from shared.models.enums import UserRole, WeekDay

router = APIRouter()


# ==================== Course Endpoints ====================

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create a new course.
    
    - **code**: Unique course code
    - **name**: Course name
    - **description**: Optional course description
    """
    try:
        service = ScheduleService(db)
        course = service.create_course(
            code=course_data.code,
            name=course_data.name,
            description=course_data.description
        )
        return course
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get a course by ID."""
    service = ScheduleService(db)
    course = service.get_course(course_id)
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    return course


@router.get("/courses", response_model=List[CourseResponse])
def get_all_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get all courses with pagination."""
    service = ScheduleService(db)
    courses = service.get_all_courses(skip=skip, limit=limit)
    return courses


@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    db: Session = Depends(get_db_session)
):
    """Update a course."""
    try:
        service = ScheduleService(db)
        
        # Build update dict (only include provided fields)
        update_data = course_data.model_dump(exclude_unset=True)
        
        course = service.update_course(course_id, **update_data)
        
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
        return course
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Delete a course."""
    service = ScheduleService(db)
    deleted = service.delete_course(course_id)
    
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    return None


# ==================== Class Endpoints ====================

@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create a new class.
    
    - **course_id**: UUID of the course
    - **mentor_id**: Optional UUID of the mentor
    - **name**: Class name
    - **room_number**: Room number
    - **day_of_week**: Day of the week
    - **schedule_time**: Class time
    """
    try:
        service = ScheduleService(db)
        class_obj = service.create_class(
            course_id=class_data.course_id,
            mentor_id=class_data.mentor_id,
            name=class_data.name,
            room_number=class_data.room_number,
            day_of_week=class_data.day_of_week,
            schedule_time=class_data.schedule_time
        )
        return class_obj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/classes/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get a class by ID."""
    service = ScheduleService(db)
    class_obj = service.get_class(class_id)
    
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    return class_obj


@router.get("/classes", response_model=List[ClassResponse])
def get_all_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get all classes with pagination."""
    service = ScheduleService(db)
    classes = service.get_all_classes(skip=skip, limit=limit)
    return classes


@router.put("/classes/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: UUID,
    class_data: ClassUpdate,
    db: Session = Depends(get_db_session)
):
    """Update a class."""
    try:
        service = ScheduleService(db)
        
        # Build update dict (only include provided fields)
        update_data = class_data.model_dump(exclude_unset=True)
        
        class_obj = service.update_class(class_id, **update_data)
        
        if not class_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        
        return class_obj
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Delete a class."""
    service = ScheduleService(db)
    deleted = service.delete_class(class_id)
    
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    return None


# ==================== Schedule Endpoints ====================

@router.get("/schedule/student/{student_id}", response_model=List[ClassResponse])
def get_student_schedule(
    student_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get schedule for a specific student."""
    service = ScheduleService(db)
    classes = service.get_schedule_for_student(student_id, skip=skip, limit=limit)
    return classes


@router.get("/schedule/mentor/{mentor_id}", response_model=List[ClassResponse])
def get_mentor_schedule(
    mentor_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get schedule for a specific mentor."""
    service = ScheduleService(db)
    classes = service.get_schedule_for_mentor(mentor_id, skip=skip, limit=limit)
    return classes


@router.get("/schedule/full", response_model=List[ClassResponse])
def get_full_schedule(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get full schedule (all classes)."""
    service = ScheduleService(db)
    classes = service.get_full_schedule(skip=skip, limit=limit)
    return classes


@router.get("/schedule/day/{day}", response_model=List[ClassResponse])
def get_schedule_by_day(
    day: WeekDay,
    db: Session = Depends(get_db_session)
):
    """Get all classes for a specific day."""
    service = ScheduleService(db)
    classes = service.get_classes_by_day(day)
    return classes


@router.get("/schedule/room/{room_number}", response_model=List[ClassResponse])
def get_schedule_by_room(
    room_number: str,
    db: Session = Depends(get_db_session)
):
    """Get all classes in a specific room."""
    service = ScheduleService(db)
    classes = service.get_classes_by_room(room_number)
    return classes


# ==================== Enrollment Endpoints ====================

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_student(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db_session)
):
    """
    Enroll a student in a class.
    
    - **student_id**: UUID of the student
    - **class_id**: UUID of the class
    """
    try:
        service = EnrollmentService(db)
        enrollment = service.enroll_student(
            student_id=enrollment_data.student_id,
            class_id=enrollment_data.class_id
        )
        return enrollment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/enrollments/{student_id}/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def unenroll_student(
    student_id: UUID,
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Unenroll a student from a class."""
    service = EnrollmentService(db)
    deleted = service.unenroll_student(student_id, class_id)
    
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    
    return None


@router.get("/enrollments/student/{student_id}", response_model=List[EnrollmentResponse])
def get_student_enrollments(
    student_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get all enrollments for a student."""
    service = EnrollmentService(db)
    enrollments = service.get_student_enrollments(student_id)
    return enrollments


@router.get("/enrollments/class/{class_id}", response_model=List[EnrollmentResponse])
def get_class_enrollments(
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get all enrollments for a class."""
    service = EnrollmentService(db)
    enrollments = service.get_class_enrollments(class_id)
    return enrollments


@router.get("/enrollments/class/{class_id}/count", response_model=int)
def get_class_enrollment_count(
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get the number of students enrolled in a class."""
    service = EnrollmentService(db)
    count = service.get_enrolled_students_count(class_id)
    return count
