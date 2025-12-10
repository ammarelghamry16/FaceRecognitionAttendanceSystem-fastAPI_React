"""
Schedule service implementing business logic.
Includes filtering methods (simplified from Strategy pattern).
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from ..repositories import CourseRepository, ClassRepository
from ..models import Course, Class


class ScheduleService:
    """
    Schedule service for managing courses and classes.
    Includes role-based filtering methods.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.class_repo = ClassRepository(db)
    
    # ==================== Course Management ====================
    
    def create_course(self, code: str, name: str, description: Optional[str] = None) -> Course:
        """
        Create a new course.
        
        Args:
            code: Course code
            name: Course name
            description: Course description
            
        Returns:
            Created course
        """
        # Check if code already exists
        if self.course_repo.code_exists(code):
            raise ValueError(f"Course code '{code}' already exists")
        
        course = Course(code=code, name=name, description=description)
        return self.course_repo.create(course)
    
    def get_course(self, course_id: UUID) -> Optional[Course]:
        """Get course by ID."""
        return self.course_repo.find_by_id(course_id)
    
    def get_all_courses(self, skip: int = 0, limit: int = 100) -> List[Course]:
        """Get all courses with pagination."""
        return self.course_repo.find_all(skip=skip, limit=limit)
    
    def update_course(self, course_id: UUID, **kwargs) -> Optional[Course]:
        """
        Update course.
        
        Args:
            course_id: UUID of the course
            **kwargs: Fields to update
            
        Returns:
            Updated course
        """
        # If updating code, check for duplicates
        if 'code' in kwargs:
            existing = self.course_repo.find_by_code(kwargs['code'])
            if existing and existing.id != course_id:
                raise ValueError(f"Course code '{kwargs['code']}' already exists")
        
        return self.course_repo.update(course_id, **kwargs)
    
    def delete_course(self, course_id: UUID) -> bool:
        """
        Delete course.
        
        Args:
            course_id: UUID of the course
            
        Returns:
            True if deleted
        """
        return self.course_repo.delete(course_id)
    
    # ==================== Class Management ====================
    
    def create_class(
        self,
        course_id: UUID,
        name: str,
        room_number: str,
        day_of_week: str,
        schedule_time,
        mentor_id: Optional[UUID] = None
    ) -> Class:
        """
        Create a new class.
        
        Args:
            course_id: UUID of the course
            name: Class name
            room_number: Room number
            day_of_week: Day of the week
            schedule_time: Class time
            mentor_id: UUID of the mentor (optional)
            
        Returns:
            Created class
        """
        # Verify course exists
        if not self.course_repo.exists(course_id):
            raise ValueError(f"Course with ID {course_id} does not exist")
        
        class_obj = Class(
            course_id=course_id,
            mentor_id=mentor_id,
            name=name,
            room_number=room_number,
            day_of_week=day_of_week,
            schedule_time=schedule_time
        )
        
        return self.class_repo.create(class_obj)
    
    def get_class(self, class_id: UUID) -> Optional[Class]:
        """Get class by ID."""
        return self.class_repo.find_by_id(class_id)
    
    def get_all_classes(self, skip: int = 0, limit: int = 100) -> List[Class]:
        """Get all classes with pagination."""
        return self.class_repo.find_all(skip=skip, limit=limit)
    
    def update_class(self, class_id: UUID, **kwargs) -> Optional[Class]:
        """
        Update class.
        
        Args:
            class_id: UUID of the class
            **kwargs: Fields to update
            
        Returns:
            Updated class
        """
        return self.class_repo.update(class_id, **kwargs)
    
    def delete_class(self, class_id: UUID) -> bool:
        """
        Delete class.
        
        Args:
            class_id: UUID of the class
            
        Returns:
            True if deleted
        """
        return self.class_repo.delete(class_id)
    
    # ==================== Schedule Filtering ====================
    
    def get_schedule_for_student(self, student_id: UUID, skip: int = 0, limit: int = 100) -> List[Class]:
        """
        Get schedule for a specific student (only enrolled classes).
        """
        return self.class_repo.find_by_student(student_id, skip=skip, limit=limit)
    
    def get_schedule_for_mentor(self, mentor_id: UUID, skip: int = 0, limit: int = 100) -> List[Class]:
        """
        Get schedule for a specific mentor (only assigned classes).
        """
        return self.class_repo.find_by_mentor(mentor_id, skip=skip, limit=limit)
    
    def get_full_schedule(self, skip: int = 0, limit: int = 100) -> List[Class]:
        """
        Get full schedule (all classes) - for admins/supervisors.
        """
        return self.class_repo.find_all(skip=skip, limit=limit)
    
    def get_schedule_by_role(
        self,
        user_id: UUID,
        role: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Class]:
        """
        Get schedule based on user role.
        """
        if role == 'student':
            return self.get_schedule_for_student(user_id, skip, limit)
        elif role == 'mentor':
            return self.get_schedule_for_mentor(user_id, skip, limit)
        elif role == 'admin':
            return self.get_full_schedule(skip, limit)
        else:
            raise ValueError(f"Invalid role: {role}")
    
    # ==================== Additional Queries ====================
    
    def get_classes_by_day(self, day: str) -> List[Class]:
        """Get all classes for a specific day."""
        return self.class_repo.find_by_day(day)
    
    def get_classes_by_room(self, room_number: str) -> List[Class]:
        """Get all classes in a specific room."""
        return self.class_repo.find_by_room(room_number)
    
    def get_classes_by_course(self, course_id: UUID) -> List[Class]:
        """Get all classes for a specific course."""
        return self.class_repo.find_by_course(course_id)
