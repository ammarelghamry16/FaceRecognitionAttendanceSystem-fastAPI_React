"""
Enrollment service for managing student enrollments.
"""
from typing import List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from ..repositories import EnrollmentRepository, ClassRepository
from ..models import Enrollment
from shared.models.user import User


class EnrollmentService:
    """
    Service for managing student enrollments in classes.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.enrollment_repo = EnrollmentRepository(db)
        self.class_repo = ClassRepository(db)
    
    def enroll_student(self, student_id: UUID, class_id: UUID) -> Enrollment:
        """
        Enroll a student in a class.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            Created enrollment
            
        Raises:
            ValueError: If class doesn't exist or student already enrolled
        """
        # Verify class exists
        if not self.class_repo.exists(class_id):
            raise ValueError(f"Class with ID {class_id} does not exist")
        
        # Check if already enrolled
        if self.enrollment_repo.exists(student_id, class_id):
            raise ValueError(f"Student is already enrolled in this class")
        
        # Create enrollment
        return self.enrollment_repo.create(student_id, class_id)
    
    def unenroll_student(self, student_id: UUID, class_id: UUID) -> bool:
        """
        Unenroll a student from a class.
        
        Args:
            student_id: UUID of the student
            class_id: UUID of the class
            
        Returns:
            True if unenrolled, False if not found
        """
        return self.enrollment_repo.delete(student_id, class_id)
    
    def get_student_enrollments(self, student_id: UUID) -> List[Enrollment]:
        """
        Get all enrollments for a student.
        """
        return self.enrollment_repo.find_by_student(student_id)
    
    def get_class_enrollments(self, class_id: UUID) -> List[Enrollment]:
        """
        Get all enrollments for a class.
        """
        return self.enrollment_repo.find_by_class(class_id)
    
    def get_class_enrollments_with_students(self, class_id: UUID) -> List[Dict[str, Any]]:
        """
        Get all enrollments for a class with student details.
        
        Returns:
            List of enrollment dicts with student_name and student_readable_id
        """
        enrollments = self.enrollment_repo.find_by_class(class_id)
        result = []
        
        for enrollment in enrollments:
            # Get student details
            student = self.db.query(User).filter(User.id == enrollment.student_id).first()
            
            result.append({
                "student_id": enrollment.student_id,
                "student_name": student.full_name if student else None,
                "student_readable_id": student.student_id if student else None,
                "class_id": enrollment.class_id,
                "enrolled_at": enrollment.enrolled_at
            })
        
        return result
    
    def get_enrolled_students_count(self, class_id: UUID) -> int:
        """
        Get the number of students enrolled in a class.
        """
        return self.enrollment_repo.count_students_in_class(class_id)
    
    def get_student_classes_count(self, student_id: UUID) -> int:
        """
        Get the number of classes a student is enrolled in.
        """
        return self.enrollment_repo.count_classes_for_student(student_id)
    
    def is_student_enrolled(self, student_id: UUID, class_id: UUID) -> bool:
        """
        Check if a student is enrolled in a class.
        """
        return self.enrollment_repo.exists(student_id, class_id)
    
    def bulk_enroll_students(self, student_ids: List[UUID], class_id: UUID) -> List[Enrollment]:
        """
        Enroll multiple students in a class.
        
        Args:
            student_ids: List of student UUIDs
            class_id: UUID of the class
            
        Returns:
            List of created enrollments
        """
        # Verify class exists
        if not self.class_repo.exists(class_id):
            raise ValueError(f"Class with ID {class_id} does not exist")
        
        enrollments = []
        for student_id in student_ids:
            # Skip if already enrolled
            if not self.enrollment_repo.exists(student_id, class_id):
                enrollment = self.enrollment_repo.create(student_id, class_id)
                enrollments.append(enrollment)
        
        return enrollments
