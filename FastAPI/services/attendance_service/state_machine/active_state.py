"""
Active State - Session is ongoing, attendance can be marked.
"""
from .session_state import SessionState, SessionContext


class ActiveState(SessionState):
    """
    Active state - session is in progress.
    Can transition to: Completed, Cancelled
    """
    
    @property
    def name(self) -> str:
        return "active"
    
    def can_activate(self) -> bool:
        return False  # Already active
    
    def can_deactivate(self) -> bool:
        return True
    
    def can_mark_attendance(self) -> bool:
        return True
    
    def activate(self, context: SessionContext) -> SessionState:
        # Already active
        return self
    
    def deactivate(self, context: SessionContext) -> SessionState:
        from .completed_state import CompletedState
        from datetime import datetime, timezone
        context.session.end_time = datetime.now(timezone.utc)
        context.session.state = "completed"
        return CompletedState()
    
    def cancel(self, context: SessionContext) -> SessionState:
        from .completed_state import CompletedState
        from datetime import datetime, timezone
        context.session.end_time = datetime.now(timezone.utc)
        context.session.state = "cancelled"
        return CompletedState()
