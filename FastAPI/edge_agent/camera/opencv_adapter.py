"""
OpenCV camera adapter implementation.
"""
import cv2
import numpy as np
from typing import Optional, Tuple
import logging

from .camera_adapter import ICameraAdapter

logger = logging.getLogger(__name__)


class OpenCVCameraAdapter(ICameraAdapter):
    """
    Camera adapter using OpenCV (cv2.VideoCapture).
    Supports USB cameras, IP cameras, and video files.
    """
    
    def __init__(self, camera_id: int = 0):
        """
        Initialize OpenCV camera adapter.
        
        Args:
            camera_id: Camera index (0 for default) or video file path
        """
        self.camera_id = camera_id
        self._cap: Optional[cv2.VideoCapture] = None
        self._width = 640
        self._height = 480
    
    def open(self) -> bool:
        """Open camera connection."""
        try:
            self._cap = cv2.VideoCapture(self.camera_id)
            
            if not self._cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_id}")
                return False
            
            # Set resolution
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
            
            # Get actual resolution
            actual_width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"Camera opened: {actual_width}x{actual_height}")
            return True
            
        except Exception as e:
            logger.error(f"Error opening camera: {e}")
            return False
    
    def close(self) -> None:
        """Close camera connection."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("Camera closed")
    
    def is_opened(self) -> bool:
        """Check if camera is opened."""
        return self._cap is not None and self._cap.isOpened()
    
    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a frame from camera.
        
        Returns:
            Tuple of (success, RGB frame)
        """
        if not self.is_opened():
            return False, None
        
        ret, frame = self._cap.read()
        
        if not ret or frame is None:
            return False, None
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return True, rgb_frame
    
    def get_resolution(self) -> Tuple[int, int]:
        """Get camera resolution."""
        if self.is_opened():
            width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            return width, height
        return self._width, self._height
    
    def set_resolution(self, width: int, height: int) -> bool:
        """Set camera resolution."""
        self._width = width
        self._height = height
        
        if self.is_opened():
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
            return True
        return False
    
    def get_fps(self) -> float:
        """Get camera FPS."""
        if self.is_opened():
            return self._cap.get(cv2.CAP_PROP_FPS)
        return 30.0
