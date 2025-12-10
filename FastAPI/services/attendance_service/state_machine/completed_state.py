"""
Completed State - Terminal state, session has ended.
"""
from .session_state import SessionState, SessionContext


class CompletedState(SessionState):
    """
    Completed state - session has ended (normally or cancelled).
    This is a terminal state - no transitions allowed.
    """
    
    @property
    def name(self) -> str:
        return "completed"
    
    def can_activate(self) -> bool:
        return False
    
    def can_deactivate(self) -> bool:
        return False
    
    def can_mark_attendance(self) -> bool:
        return False  # Cannot mark attendance after session ends
    
    def activate(self, context: SessionContext) -> SessionState:
        # Cannot reactivate completed session
        return self
    
    def deactivate(self, context: SessionContext) -> SessionState:
        # Already completed
        return self
    
    def cancel(self, context: SessionContext) -> SessionState:
        # Already in terminal state
        return self
