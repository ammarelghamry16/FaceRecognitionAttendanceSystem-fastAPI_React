"""
Student ID Sequence model - tracks sequential student IDs per year.
"""
from sqlalchemy import Column, Integer
from ..database.base import Base


class StudentIdSequence(Base):
    """
    Tracks the last used sequence number for student IDs per year.
    Used to generate human-readable student IDs in format YYYY/NNNNN.
    """
    __tablename__ = "student_id_sequences"

    year = Column(Integer, primary_key=True)
    last_sequence = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"<StudentIdSequence(year={self.year}, last_sequence={self.last_sequence})>"
