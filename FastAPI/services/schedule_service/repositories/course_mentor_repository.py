"""
CourseMentor repository for managing course-mentor assignments.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.course_mentor import CourseMentor


class CourseMentorRepository:
    """
    Repository for managing CourseMentor junction table.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def assign_mentor(self, course_id: UUID, mentor_id: UUID) -> CourseMentor:
        """
        Assign a mentor to a course.
        """
        # Check if already exists
        existing = self.get_assignment(course_id, mentor_id)
        if existing:
            return existing
        
        assignment = CourseMentor(course_id=course_id, mentor_id=mentor_id)
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment
    
    def remove_mentor(self, course_id: UUID, mentor_id: UUID) -> bool:
        """
        Remove a mentor from a course.
        """
        result = self.db.query(CourseMentor).filter(
            and_(
                CourseMentor.course_id == course_id,
                CourseMentor.mentor_id == mentor_id
            )
        ).delete()
        self.db.commit()
        return result > 0
    
    def get_assignment(self, course_id: UUID, mentor_id: UUID) -> Optional[CourseMentor]:
        """
        Get a specific course-mentor assignment.
        """
        return self.db.query(CourseMentor).filter(
            and_(
                CourseMentor.course_id == course_id,
                CourseMentor.mentor_id == mentor_id
            )
        ).first()
    
    def get_mentors_for_course(self, course_id: UUID) -> List[UUID]:
        """
        Get all mentor IDs assigned to a course.
        """
        results = self.db.query(CourseMentor.mentor_id).filter(
            CourseMentor.course_id == course_id
        ).all()
        return [r[0] for r in results]
    
    def get_courses_for_mentor(self, mentor_id: UUID) -> List[UUID]:
        """
        Get all course IDs a mentor is assigned to.
        """
        results = self.db.query(CourseMentor.course_id).filter(
            CourseMentor.mentor_id == mentor_id
        ).all()
        return [r[0] for r in results]
    
    def set_mentors_for_course(self, course_id: UUID, mentor_ids: List[UUID]) -> List[CourseMentor]:
        """
        Set the complete list of mentors for a course (replaces existing).
        """
        # Remove all existing assignments
        self.db.query(CourseMentor).filter(
            CourseMentor.course_id == course_id
        ).delete()
        
        # Add new assignments
        assignments = []
        for mentor_id in mentor_ids:
            assignment = CourseMentor(course_id=course_id, mentor_id=mentor_id)
            self.db.add(assignment)
            assignments.append(assignment)
        
        self.db.commit()
        return assignments
    
    def is_mentor_assigned_to_course(self, course_id: UUID, mentor_id: UUID) -> bool:
        """
        Check if a mentor is assigned to a course.
        """
        return self.get_assignment(course_id, mentor_id) is not None
