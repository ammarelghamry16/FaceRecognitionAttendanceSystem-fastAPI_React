"""
API Key model for Edge Agent authentication.
"""
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from shared.database.base import Base, TimestampMixin


class APIKey(Base, TimestampMixin):
    """
    API Key model for authenticating Edge Agents.
    
    API keys are used by Edge Agents to authenticate when sending
    frames to the API Gateway. Keys are stored as hashes for security.
    """
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    edge_agent_id = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<APIKey(id={self.id}, agent={self.edge_agent_id}, active={self.is_active})>"

    def is_expired(self) -> bool:
        """Check if the API key has expired."""
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self) -> bool:
        """Check if the API key is valid (active and not expired)."""
        return self.is_active and not self.is_expired()
