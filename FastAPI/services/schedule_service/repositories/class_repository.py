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
    
    def find_conflicts_by_room(
        self, 
        room_number: str, 
        day_of_week: str, 
        schedule_time, 
        duration_minutes: int = 90,
        exclude_class_id: Optional[UUID] = None
    ) -> List[Class]:
        """
        Find classes that conflict with the given room, day, and time.
        """
        from datetime import datetime, timedelta
        
        # Calculate time range
        if isinstance(schedule_time, str):
            start_time = datetime.strptime(schedule_time, "%H:%M").time()
        else:
            start_time = schedule_time
        
        # Create datetime for calculation
        base_date = datetime(2000, 1, 1)
        start_dt = datetime.combine(base_date, start_time)
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        end_time = end_dt.time()
        
        query = (
            self.db.query(self.model)
            .options(joinedload(self.model.course))
            .filter(
                self.model.room_number == room_number,
                self.model.day_of_week == day_of_week
            )
        )
        
        if exclude_class_id:
            query = query.filter(self.model.id != exclude_class_id)
        
        # Get all classes in that room on that day and filter by time overlap
        classes = query.all()
        conflicts = []
        
        for cls in classes:
            cls_start = cls.schedule_time
            cls_start_dt = datetime.combine(base_date, cls_start)
            cls_end_dt = cls_start_dt + timedelta(minutes=duration_minutes)
            cls_end = cls_end_dt.time()
            
            # Check for overlap
            if not (end_time <= cls_start or start_time >= cls_end):
                conflicts.append(cls)
        
        return conflicts
    
    def find_conflicts_by_mentor(
        self, 
        mentor_id: UUID, 
        day_of_week: str, 
        schedule_time, 
        duration_minutes: int = 90,
        exclude_class_id: Optional[UUID] = None
    ) -> List[Class]:
        """
        Find classes that conflict with the given mentor, day, and time.
        """
        from datetime import datetime, timedelta
        
        if isinstance(schedule_time, str):
            start_time = datetime.strptime(schedule_time, "%H:%M").time()
        else:
            start_time = schedule_time
        
        base_date = datetime(2000, 1, 1)
        start_dt = datetime.combine(base_date, start_time)
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        end_time = end_dt.time()
        
        query = (
            self.db.query(self.model)
            .options(joinedload(self.model.course))
            .filter(
                self.model.mentor_id == mentor_id,
                self.model.day_of_week == day_of_week
            )
        )
        
        if exclude_class_id:
            query = query.filter(self.model.id != exclude_class_id)
        
        classes = query.all()
        conflicts = []
        
        for cls in classes:
            cls_start = cls.schedule_time
            cls_start_dt = datetime.combine(base_date, cls_start)
            cls_end_dt = cls_start_dt + timedelta(minutes=duration_minutes)
            cls_end = cls_end_dt.time()
            
            if not (end_time <= cls_start or start_time >= cls_end):
                conflicts.append(cls)
        
        return conflicts
