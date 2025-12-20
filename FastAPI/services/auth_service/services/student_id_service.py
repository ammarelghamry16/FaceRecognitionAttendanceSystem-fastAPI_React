"""
Student ID Service - Generates human-readable student IDs in format YYYY/NNNNN.
"""
import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text


class StudentIdService:
    """
    Service for generating and validating human-readable student IDs.
    Format: YYYY/NNNNN (e.g., 2025/00001)
    """
    
    STUDENT_ID_PATTERN = re.compile(r'^(\d{4})/(\d{5})$')
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_student_id(self, year: Optional[int] = None) -> str:
        """
        Generate a new unique student ID for the given year.
        
        Args:
            year: The enrollment year. Defaults to current year.
            
        Returns:
            A student ID in format YYYY/NNNNN (e.g., 2025/00001)
        """
        if year is None:
            year = datetime.now().year
        
        # Atomically get and increment the sequence for this year
        result = self.db.execute(text("""
            INSERT INTO student_id_sequences (year, last_sequence)
            VALUES (:year, 1)
            ON CONFLICT (year) DO UPDATE 
            SET last_sequence = student_id_sequences.last_sequence + 1
            RETURNING last_sequence;
        """), {"year": year})
        
        sequence = result.fetchone()[0]
        self.db.commit()
        
        return f"{year}/{sequence:05d}"
    
    def validate_student_id(self, student_id: str) -> bool:
        """
        Validate that a student ID matches the expected format.
        
        Args:
            student_id: The student ID to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not student_id:
            return False
        return bool(self.STUDENT_ID_PATTERN.match(student_id))
    
    def parse_student_id(self, student_id: str) -> Optional[tuple[int, int]]:
        """
        Parse a student ID into its components.
        
        Args:
            student_id: The student ID to parse
            
        Returns:
            Tuple of (year, sequence) or None if invalid
        """
        match = self.STUDENT_ID_PATTERN.match(student_id)
        if not match:
            return None
        return int(match.group(1)), int(match.group(2))
    
    def get_next_sequence(self, year: int) -> int:
        """
        Get the next sequence number for a given year without incrementing.
        
        Args:
            year: The year to check
            
        Returns:
            The next sequence number that would be assigned
        """
        result = self.db.execute(text("""
            SELECT COALESCE(last_sequence, 0) + 1 
            FROM student_id_sequences 
            WHERE year = :year;
        """), {"year": year})
        
        row = result.fetchone()
        return row[0] if row else 1
