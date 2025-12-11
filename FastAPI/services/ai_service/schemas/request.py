"""
Request schemas for AI Service.
"""
from pydantic import BaseModel, Field
from uuid import UUID


class EnrollRequest(BaseModel):
    """Request for face enrollment (used with form data)."""
    user_id: UUID
