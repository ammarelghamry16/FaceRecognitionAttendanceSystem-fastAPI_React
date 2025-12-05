"""
Enrollment repository for data access.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from ..models.enrollment import Enrollment


class EnrollmentRepository:
    """
    Repository for managing Enrollment entities.
    Note: Enrollment uses composite primary key, so it doesn't extend BaseRepository.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Enrollment
    
    def create(self, student_id: UUID, class_id: UUID) -> Enrollment:
        """
        Create a new enrollment.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            Created enrollment
        """
        try:
            enrollment = Enrollment(student_id=student_id, class_id=class_id)
            self.db.add(enrollment)
            self.db.commit()
            self.db.refresh(enrollment)
            return enrollment
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    
    def find_by_student_and_class(self, student_id: UUID, class_id: UUID) -> Optional[Enrollment]:
        """
        Find an enrollment by student and class.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            Enrollment if found, None otherwise
        """
        return (
            self.db.query(self.model)
            .filter(
                self.model.student_id == student_id,
                self.model.class_id == class_id
            )
            .first()
        )
    
    def find_by_student(self, student_id: UUID) -> List[Enrollment]:
        """
        Get all enrollments for a student.
        
        Args:
            student_id: UUID of the student
            
        Returns:
            List of enrollments
        """
        return (
            self.db.query(self.model)
            .options(joinedload(self.model.class_))
            .filter(self.model.student_id == student_id)
            .all()
        )
    
    def find_by_class(self, class_id: UUID) -> List[Enrollment]:
        """
        Get all enrollments for a class.
        
        Args:
            class_id: UUID of the class
            
        Returns:
            List of enrollments
        """
        return (
            self.db.query(self.model)
            .options(joinedload(self.model.student))
            .filter(self.model.class_id == class_id)
            .all()
        )
    
    def delete(self, student_id: UUID, class_id: UUID) -> bool:
        """
        Delete an enrollment.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            True if deleted, False if not found
        """
        try:
            enrollment = self.find_by_student_and_class(student_id, class_id)
            if enrollment:
                self.db.delete(enrollment)
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            raise e
    
    def exists(self, student_id: UUID, class_id: UUID) -> bool:
        """
        Check if an enrollment exists.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            True if exists, False otherwise
        """
        return self.find_by_student_and_class(student_id, class_id) is not None
    
    def count_students_in_class(self, class_id: UUID) -> int:
        """
        Count the number of students enrolled in a class.
        
        Args:
            class_id: UUID of the class
            
        Returns:
            Number of enrolled students
        """
        return self.db.query(self.model).filter(self.model.class_id == class_id).count()
    
    def count_classes_for_student(self, student_id: UUID) -> int:
        """
        Count the number of classes a student is enrolled in.
        
        Args:
            student_id: UUID of the student
            
        Returns:
            Number of enrolled classes
        """
        return self.db.query(self.model).filter(self.model.student_id == student_id).count()
