"""
Abstract camera adapter interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, Tuple
import numpy as np


class ICameraAdapter(ABC):
    """
    Abstract interface for camera adapters.
    Allows swapping between different camera implementations.
    """
    
    @abstractmethod
    def open(self) -> bool:
        """
        Open camera connection.
        
        Returns:
            True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    def close(self) -> None:
        """Close camera connection."""
        pass
    
    @abstractmethod
    def is_opened(self) -> bool:
        """Check if camera is opened."""
        pass
    
    @abstractmethod
    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a frame from camera.
        
        Returns:
            Tuple of (success, frame) where frame is RGB numpy array
        """
        pass
    
    @abstractmethod
    def get_resolution(self) -> Tuple[int, int]:
        """Get camera resolution (width, height)."""
        pass
    
    @abstractmethod
    def set_resolution(self, width: int, height: int) -> bool:
        """Set camera resolution."""
        pass
