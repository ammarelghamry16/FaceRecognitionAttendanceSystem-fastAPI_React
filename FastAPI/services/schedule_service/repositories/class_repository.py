"""
Class repository for data access.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from ..models.class_model import Class
from ..models.enrollment import Enrollment
from .base_repository import BaseRepository


class ClassRepository(BaseRepository[Class]):
    """
    Repository for managing Class entities.
    """
    
    def __init__(self, db: Session):
        super().__init__(Class, db)
    
    def find_by_mentor(self, mentor_id: UUID, skip: int = 0, limit: int = 100) -> List[Class]:
        """
        Get all classes assigned to a specific mentor.
        """
        return (
            self.db.query(self.model)
            .options(joinedload(self.model.course))
            .filter(self.model.mentor_id == mentor_id)
            .order_by(self.model.day_of_week, self.model.schedule_time)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def find_by_student(self, student_id: UUID, skip: int = 0, limit: int = 100) -> List[Class]:
        """
        Get all classes a student is enrolled in.
        """
        return (
            self.db.query(self.model)
            .options(joinedload(self.model.course))
            .join(Enrollment, self.model.id == Enrollment.class_id)
            .filter(Enrollment.student_id == student_id)
            .order_by(self.model.day_of_week, self.model.schedule_time)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def find_by_course(self, course_id: UUID) -> List[Class]:
        """
        Get all classes for a specific course.
        """
        return (
            self.db.query(self.model)
            .filter(self.model.course_id == course_id)
            .order_by(self.model.day_of_week, self.model.schedule_time)
            .all()
        )
    
    def find_by_day(self, day: str) -> List[Class]:
        """
        Get all classes scheduled for a specific day.
        """
        return (
            self.db.query(self.model)
            .options(joinedload(self.model.course))
            .filter(self.model.day_of_week == day)
            .order_by(self.model.schedule_time)
            .all()
        )
    
    def find_by_room(self, room_number: str) -> List[Class]:
        """
        Get all classes in a specific room.
        """
        return (
            self.db.query(self.model)
            .filter(self.model.room_number == room_number)
            .order_by(self.model.day_of_week, self.model.schedule_time)
            .all()
        )
    
    def find_with_details(self, class_id: UUID) -> Optional[Class]:
        """
        Get a class with all related data (course, enrollments).
        """
        return (
            self.db.query(self.model)
            .options(
                joinedload(self.model.course),
                joinedload(self.model.enrollments)
            )
            .filter(self.model.id == class_id)
            .first()
        )
