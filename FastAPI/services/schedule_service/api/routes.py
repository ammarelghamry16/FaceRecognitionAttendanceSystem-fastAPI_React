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
    CourseCreate, CourseUpdate, CourseResponse, CourseWithMentorsResponse, MentorInfo,
    CourseMentorAssign,
    ClassCreate, ClassUpdate, ClassResponse, ClassDetailResponse,
    EnrollmentCreate, EnrollmentResponse, EnrollmentWithStudentResponse,
    ScheduleResponse
)
from shared.models.enums import UserRole, WeekDay

router = APIRouter()


# ==================== Course Endpoints ====================

@router.post("/courses", response_model=CourseWithMentorsResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db_session)
):
    """
    Create a new course with optional mentor assignments.
    
    - **code**: Unique course code
    - **name**: Course name
    - **description**: Optional course description
    - **mentor_ids**: Optional list of mentor UUIDs to assign
    """
    try:
        service = ScheduleService(db)
        course = service.create_course(
            code=course_data.code,
            name=course_data.name,
            description=course_data.description,
            mentor_ids=course_data.mentor_ids
        )
        
        # Get mentor info
        mentor_ids = service.get_mentors_for_course(course.id)
        mentors = _get_mentor_info(db, mentor_ids)
        
        return CourseWithMentorsResponse(
            id=course.id,
            code=course.code,
            name=course.name,
            description=course.description,
            mentor_ids=mentor_ids,
            mentors=mentors,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/courses/{course_id}", response_model=CourseWithMentorsResponse)
def get_course(
    course_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get a course by ID with assigned mentors."""
    service = ScheduleService(db)
    course = service.get_course(course_id)
    
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Get mentor info
    mentor_ids = service.get_mentors_for_course(course.id)
    mentors = _get_mentor_info(db, mentor_ids)
    
    return CourseWithMentorsResponse(
        id=course.id,
        code=course.code,
        name=course.name,
        description=course.description,
        mentor_ids=mentor_ids,
        mentors=mentors,
        created_at=course.created_at,
        updated_at=course.updated_at
    )


@router.get("/courses", response_model=List[CourseWithMentorsResponse])
def get_all_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db_session)
):
    """Get all courses with pagination and mentor info."""
    service = ScheduleService(db)
    courses = service.get_all_courses(skip=skip, limit=limit)
    
    result = []
    for course in courses:
        mentor_ids = service.get_mentors_for_course(course.id)
        mentors = _get_mentor_info(db, mentor_ids)
        result.append(CourseWithMentorsResponse(
            id=course.id,
            code=course.code,
            name=course.name,
            description=course.description,
            mentor_ids=mentor_ids,
            mentors=mentors,
            created_at=course.created_at,
            updated_at=course.updated_at
        ))
    
    return result


@router.put("/courses/{course_id}", response_model=CourseWithMentorsResponse)
def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    db: Session = Depends(get_db_session)
):
    """Update a course including mentor assignments."""
    try:
        service = ScheduleService(db)
        
        # Build update dict (only include provided fields, excluding mentor_ids)
        update_data = course_data.model_dump(exclude_unset=True, exclude={'mentor_ids'})
        
        course = service.update_course(
            course_id, 
            mentor_ids=course_data.mentor_ids,
            **update_data
        )
        
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        
        # Get mentor info
        mentor_ids = service.get_mentors_for_course(course.id)
        mentors = _get_mentor_info(db, mentor_ids)
        
        return CourseWithMentorsResponse(
            id=course.id,
            code=course.code,
            name=course.name,
            description=course.description,
            mentor_ids=mentor_ids,
            mentors=mentors,
            created_at=course.created_at,
            updated_at=course.updated_at
        )
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


# ==================== Course Mentor Endpoints ====================

@router.get("/courses/{course_id}/mentors", response_model=List[MentorInfo])
def get_course_mentors(
    course_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get all mentors assigned to a course."""
    service = ScheduleService(db)
    
    # Verify course exists
    course = service.get_course(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    mentor_ids = service.get_mentors_for_course(course_id)
    return _get_mentor_info(db, mentor_ids)


@router.post("/courses/{course_id}/mentors", status_code=status.HTTP_201_CREATED)
def assign_mentor_to_course(
    course_id: UUID,
    data: CourseMentorAssign,
    db: Session = Depends(get_db_session)
):
    """Assign a mentor to a course."""
    service = ScheduleService(db)
    
    # Verify course exists
    course = service.get_course(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    # Verify mentor exists and is a mentor
    from services.auth_service.repositories.user_repository import UserRepository
    user_repo = UserRepository(db)
    mentor = user_repo.find_by_id(data.mentor_id)
    if not mentor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found")
    if mentor.role != 'mentor':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a mentor")
    
    service.assign_mentor_to_course(course_id, data.mentor_id)
    return {"message": "Mentor assigned successfully"}


@router.delete("/courses/{course_id}/mentors/{mentor_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_mentor_from_course(
    course_id: UUID,
    mentor_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Remove a mentor from a course."""
    service = ScheduleService(db)
    
    # Verify course exists
    course = service.get_course(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    
    removed = service.remove_mentor_from_course(course_id, mentor_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentor assignment not found")
    
    return None


# Helper function to get mentor info
def _get_mentor_info(db: Session, mentor_ids: List[UUID]) -> List[MentorInfo]:
    """Get mentor info for a list of mentor IDs."""
    if not mentor_ids:
        return []
    
    from services.auth_service.repositories.user_repository import UserRepository
    user_repo = UserRepository(db)
    
    mentors = []
    for mentor_id in mentor_ids:
        user = user_repo.find_by_id(mentor_id)
        if user:
            mentors.append(MentorInfo(
                id=user.id,
                full_name=user.full_name,
                email=user.email
            ))
    
    return mentors


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


@router.post("/classes/check-conflicts")
def check_class_conflicts(
    room_number: str = Query(..., description="Room number"),
    day_of_week: str = Query(..., description="Day of the week"),
    schedule_time: str = Query(..., description="Schedule time (HH:MM)"),
    mentor_id: UUID = Query(None, description="Mentor UUID (optional)"),
    duration_minutes: int = Query(90, description="Class duration in minutes"),
    exclude_class_id: UUID = Query(None, description="Class ID to exclude (for updates)"),
    db: Session = Depends(get_db_session)
):
    """
    Check for scheduling conflicts before creating/updating a class.
    
    Returns conflicts for:
    - Room: Another class in the same room at overlapping time
    - Mentor: The mentor has another class at overlapping time
    """
    from datetime import datetime
    
    try:
        # Parse time string
        time_obj = datetime.strptime(schedule_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid time format. Use HH:MM"
        )
    
    service = ScheduleService(db)
    conflicts = service.check_class_conflicts(
        room_number=room_number,
        day_of_week=day_of_week,
        schedule_time=time_obj,
        mentor_id=mentor_id,
        duration_minutes=duration_minutes,
        exclude_class_id=exclude_class_id
    )
    
    return conflicts


@router.post("/classes/create-with-validation")
def create_class_with_validation(
    class_data: ClassCreate,
    duration_minutes: int = Query(90, description="Class duration in minutes"),
    db: Session = Depends(get_db_session)
):
    """
    Create a new class with conflict validation.
    
    Returns:
    - success: Whether the class was created
    - class: The created class (if successful)
    - conflicts: Conflict details (if any)
    """
    try:
        service = ScheduleService(db)
        result = service.create_class_with_validation(
            course_id=class_data.course_id,
            mentor_id=class_data.mentor_id,
            name=class_data.name,
            room_number=class_data.room_number,
            day_of_week=class_data.day_of_week,
            schedule_time=class_data.schedule_time,
            duration_minutes=duration_minutes
        )
        
        if result['success']:
            return {
                'success': True,
                'class': ClassResponse.model_validate(result['class']),
                'conflicts': None
            }
        else:
            return {
                'success': False,
                'class': None,
                'conflicts': result['conflicts']
            }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


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


@router.get("/enrollments/class/{class_id}", response_model=List[EnrollmentWithStudentResponse])
def get_class_enrollments(
    class_id: UUID,
    db: Session = Depends(get_db_session)
):
    """Get all enrollments for a class with student details."""
    service = EnrollmentService(db)
    enrollments = service.get_class_enrollments_with_students(class_id)
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
