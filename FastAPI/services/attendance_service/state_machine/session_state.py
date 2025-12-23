"""
Abstract base class for Session State pattern.
"""
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Optional
from datetime import datetime

if TYPE_CHECKING:
    from ..models.attendance_session import AttendanceSession


class SessionState(ABC):
    """
    Abstract base class for session states.
    Implements State pattern for attendance session lifecycle.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return state name."""
        pass
    
    @abstractmethod
    def can_activate(self) -> bool:
        """Check if session can be activated from this state."""
        pass
    
    @abstractmethod
    def can_deactivate(self) -> bool:
        """Check if session can be deactivated from this state."""
        pass
    
    @abstractmethod
    def can_mark_attendance(self) -> bool:
        """Check if attendance can be marked in this state."""
        pass
    
    @abstractmethod
    def activate(self, context: 'SessionContext') -> 'SessionState':
        """Transition to active state."""
        pass
    
    @abstractmethod
    def deactivate(self, context: 'SessionContext') -> 'SessionState':
        """Transition to completed/inactive state."""
        pass
    
    @abstractmethod
    def cancel(self, context: 'SessionContext') -> 'SessionState':
        """Cancel the session."""
        pass


class SessionContext:
    """
    Context class that maintains current state and delegates operations.
    """
    
    def __init__(self, session: 'AttendanceSession'):
        self.session = session
        self._state = self._get_state_from_session()
    
    def _get_state_from_session(self) -> SessionState:
        """Get appropriate state object based on session state string."""
        from .inactive_state import InactiveState
        from .active_state import ActiveState
        from .completed_state import CompletedState
        
        state_map = {
            "inactive": InactiveState(),
            "active": ActiveState(),
            "completed": CompletedState(),
            "cancelled": CompletedState(),  # Cancelled is terminal like completed
        }
        return state_map.get(self.session.state, InactiveState())
    
    @property
    def state(self) -> SessionState:
        return self._state
    
    @state.setter
    def state(self, new_state: SessionState):
        self._state = new_state
        # Don't overwrite if already set (e.g., cancelled vs completed)
        if self.session.state not in ["cancelled", "completed"]:
            self.session.state = new_state.name
    
    def can_activate(self) -> bool:
        return self._state.can_activate()
    
    def can_deactivate(self) -> bool:
        return self._state.can_deactivate()
    
    def can_mark_attendance(self) -> bool:
        return self._state.can_mark_attendance()
    
    def activate(self) -> bool:
        new_state = self._state.activate(self)
        if new_state != self._state:
            self.state = new_state
            return True
        return False
    
    def deactivate(self) -> bool:
        new_state = self._state.deactivate(self)
        if new_state != self._state:
            self.state = new_state
            return True
        return False
    
    def cancel(self) -> bool:
        new_state = self._state.cancel(self)
        if new_state != self._state:
            self.state = new_state
            return True
        return False
