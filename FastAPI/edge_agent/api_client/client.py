"""
API Client for communicating with the backend.
"""
import requests
import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
import io
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class RecognitionResponse:
    """Response from recognition API."""
    success: bool
    recognized: bool = False
    user_id: Optional[str] = None
    confidence: float = 0.0
    attendance_marked: bool = False
    status: Optional[str] = None
    message: str = ""


class APIClient:
    """
    Client for communicating with the Face Recognition API.
    Implements retry logic with exponential backoff.
    """
    
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        self._session = requests.Session()
        if api_key:
            self._session.headers['X-API-Key'] = api_key
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Optional[requests.Response]:
        """Make HTTP request with retry logic."""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                response = self._session.request(
                    method,
                    url,
                    timeout=self.timeout,
                    **kwargs
                )
                return response
                
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1}/{self.max_retries})")
            except requests.exceptions.ConnectionError:
                logger.warning(f"Connection error (attempt {attempt + 1}/{self.max_retries})")
            except Exception as e:
                logger.error(f"Request error: {e}")
                return None
            
            # Exponential backoff
            if attempt < self.max_retries - 1:
                delay = self.retry_delay * (2 ** attempt)
                time.sleep(delay)
        
        logger.error(f"Failed after {self.max_retries} attempts")
        return None
    
    def health_check(self) -> bool:
        """Check if API is healthy."""
        response = self._make_request('GET', '/health')
        return response is not None and response.status_code == 200
    
    def recognize_face(self, image: np.ndarray) -> RecognitionResponse:
        """
        Send image for face recognition.
        
        Args:
            image: RGB image as numpy array
            
        Returns:
            RecognitionResponse with results
        """
        try:
            # Convert numpy array to JPEG bytes
            img = Image.fromarray(image)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            files = {'image': ('frame.jpg', buffer, 'image/jpeg')}
            
            response = self._make_request(
                'POST',
                '/api/ai/recognize',
                files=files
            )
            
            if response is None:
                return RecognitionResponse(success=False, message="Request failed")
            
            if response.status_code == 200:
                data = response.json()
                return RecognitionResponse(
                    success=True,
                    recognized=data.get('recognized', False),
                    user_id=data.get('user_id'),
                    confidence=data.get('confidence', 0.0),
                    message=data.get('message', '')
                )
            else:
                return RecognitionResponse(
                    success=False,
                    message=f"API error: {response.status_code}"
                )
                
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return RecognitionResponse(success=False, message=str(e))
    
    def recognize_for_attendance(
        self,
        session_id: str,
        image: np.ndarray
    ) -> RecognitionResponse:
        """
        Send image for recognition and attendance marking.
        
        Args:
            session_id: Active attendance session ID
            image: RGB image as numpy array
            
        Returns:
            RecognitionResponse with attendance status
        """
        try:
            # Convert numpy array to JPEG bytes
            img = Image.fromarray(image)
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            files = {'image': ('frame.jpg', buffer, 'image/jpeg')}
            
            response = self._make_request(
                'POST',
                f'/api/ai/recognize/attendance/{session_id}',
                files=files
            )
            
            if response is None:
                return RecognitionResponse(success=False, message="Request failed")
            
            if response.status_code == 200:
                data = response.json()
                return RecognitionResponse(
                    success=True,
                    recognized=data.get('recognized', False),
                    user_id=data.get('user_id'),
                    confidence=data.get('confidence', 0.0),
                    attendance_marked=data.get('attendance_marked', False),
                    status=data.get('status'),
                    message=data.get('message', '')
                )
            else:
                return RecognitionResponse(
                    success=False,
                    message=f"API error: {response.status_code}"
                )
                
        except Exception as e:
            logger.error(f"Attendance recognition error: {e}")
            return RecognitionResponse(success=False, message=str(e))
    
    def close(self):
        """Close the session."""
        self._session.close()
