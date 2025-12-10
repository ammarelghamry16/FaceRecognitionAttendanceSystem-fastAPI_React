"""
Edge Agent - Main capture and recognition loop.
"""
import time
import logging
from typing import Optional, Set
from datetime import datetime
import cv2
import numpy as np

from .config import EdgeAgentConfig
from .camera import OpenCVCameraAdapter
from .api_client import APIClient

logger = logging.getLogger(__name__)


class EdgeAgent:
    """
    Edge Agent for capturing frames and sending for recognition.
    
    Features:
    - Configurable capture rate
    - Face detection before sending (reduces API calls)
    - Duplicate detection (don't re-send same person)
    - Visual preview with face boxes
    """
    
    def __init__(self, config: Optional[EdgeAgentConfig] = None):
        self.config = config or EdgeAgentConfig()
        self.camera = OpenCVCameraAdapter(self.config.camera_id)
        self.api_client = APIClient(
            base_url=self.config.api_base_url,
            api_key=self.config.api_key,
            timeout=self.config.request_timeout_seconds,
            max_retries=self.config.max_retries,
            retry_delay=self.config.retry_delay_seconds
        )
        
        self._running = False
        self._recognized_users: Set[str] = set()  # Track recognized users in session
        self._last_capture_time = 0.0
        self._face_cascade = None
    
    def _load_face_detector(self):
        """Load OpenCV face detector for pre-filtering."""
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self._face_cascade = cv2.CascadeClassifier(cascade_path)
            logger.info("Face detector loaded")
        except Exception as e:
            logger.warning(f"Could not load face detector: {e}")
            self._face_cascade = None
    
    def _detect_faces_local(self, frame: np.ndarray) -> list:
        """
        Detect faces locally using OpenCV (fast pre-filter).
        
        Returns:
            List of (x, y, w, h) face rectangles
        """
        if self._face_cascade is None:
            return [(0, 0, frame.shape[1], frame.shape[0])]  # Return full frame
        
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        faces = self._face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(self.config.min_face_size, self.config.min_face_size)
        )
        
        return list(faces)
    
    def start(self, session_id: Optional[str] = None):
        """
        Start the edge agent capture loop.
        
        Args:
            session_id: Optional attendance session ID
        """
        self.config.session_id = session_id
        self._recognized_users.clear()
        
        # Open camera
        if not self.camera.open():
            logger.error("Failed to open camera")
            return
        
        # Load face detector
        self._load_face_detector()
        
        # Check API health
        if not self.api_client.health_check():
            logger.warning("API health check failed, continuing anyway...")
        
        self._running = True
        logger.info(f"Edge Agent started (session: {session_id or 'none'})")
        
        try:
            self._capture_loop()
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        finally:
            self.stop()
    
    def stop(self):
        """Stop the edge agent."""
        self._running = False
        self.camera.close()
        self.api_client.close()
        
        if self.config.show_preview:
            cv2.destroyAllWindows()
        
        logger.info("Edge Agent stopped")
    
    def _capture_loop(self):
        """Main capture and recognition loop."""
        frame_interval = 1.0 / self.config.capture_fps
        
        while self._running:
            current_time = time.time()
            
            # Rate limiting
            if current_time - self._last_capture_time < frame_interval:
                time.sleep(0.01)
                continue
            
            # Read frame
            success, frame = self.camera.read_frame()
            if not success or frame is None:
                logger.warning("Failed to read frame")
                time.sleep(0.1)
                continue
            
            # Detect faces locally (fast pre-filter)
            faces = self._detect_faces_local(frame)
            
            # Process if faces detected
            if faces:
                self._process_frame(frame, faces)
            
            # Show preview
            if self.config.show_preview:
                self._show_preview(frame, faces)
            
            self._last_capture_time = current_time
            
            # Check for quit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    def _process_frame(self, frame: np.ndarray, faces: list):
        """Process frame for recognition."""
        if self.config.session_id:
            # Attendance mode
            response = self.api_client.recognize_for_attendance(
                self.config.session_id,
                frame
            )
            
            if response.success and response.recognized:
                user_id = response.user_id
                
                if user_id not in self._recognized_users:
                    self._recognized_users.add(user_id)
                    status = "PRESENT" if response.attendance_marked else "ALREADY MARKED"
                    logger.info(f"Recognized: {user_id} ({response.confidence:.1%}) - {status}")
                    
        else:
            # Recognition only mode
            response = self.api_client.recognize_face(frame)
            
            if response.success and response.recognized:
                logger.info(f"Recognized: {response.user_id} ({response.confidence:.1%})")
    
    def _show_preview(self, frame: np.ndarray, faces: list):
        """Show preview window with face boxes."""
        # Convert RGB to BGR for OpenCV display
        display_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        
        # Draw face rectangles
        if self.config.draw_faces:
            for (x, y, w, h) in faces:
                cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        
        # Add status text
        status = f"Session: {self.config.session_id or 'None'}"
        cv2.putText(display_frame, status, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        recognized_count = len(self._recognized_users)
        cv2.putText(display_frame, f"Recognized: {recognized_count}", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        cv2.imshow('Edge Agent', display_frame)
    
    def reset_recognized(self):
        """Reset the set of recognized users."""
        self._recognized_users.clear()
        logger.info("Recognized users reset")
