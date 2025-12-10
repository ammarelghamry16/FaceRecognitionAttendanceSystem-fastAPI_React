"""
Inactive State - Initial state before session starts.
"""
from .session_state import SessionState, SessionContext


class InactiveState(SessionState):
    """
    Inactive state - session has not started yet.
    Can transition to: Active
    """
    
    @property
    def name(self) -> str:
        return "inactive"
    
    def can_activate(self) -> bool:
        return True
    
    def can_deactivate(self) -> bool:
        return False
    
    def can_mark_attendance(self) -> bool:
        return False
    
    def activate(self, context: SessionContext) -> SessionState:
        from .active_state import ActiveState
        from datetime import datetime, timezone
        context.session.start_time = datetime.now(timezone.utc)
        return ActiveState()
    
    def deactivate(self, context: SessionContext) -> SessionState:
        # Cannot deactivate an inactive session
        return self
    
    def cancel(self, context: SessionContext) -> SessionState:
        # Can cancel even before starting
        from .completed_state import CompletedState
        context.session.state = "cancelled"
        return CompletedState()
