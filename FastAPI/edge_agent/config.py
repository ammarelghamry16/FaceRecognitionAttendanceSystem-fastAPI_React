"""
Edge Agent Configuration
"""
import os
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class EdgeAgentConfig:
    """Configuration for Edge Agent."""
    
    # API Configuration
    api_base_url: str = field(default_factory=lambda: os.getenv("API_BASE_URL", "http://localhost:8000"))
    api_key: str = field(default_factory=lambda: os.getenv("EDGE_AGENT_API_KEY", ""))
    
    # Camera Configuration
    camera_id: int = field(default_factory=lambda: int(os.getenv("CAMERA_ID", "0")))
    frame_width: int = 640
    frame_height: int = 480
    
    # Capture Configuration
    capture_fps: float = 2.0  # Frames per second to process
    jpeg_quality: int = 85
    
    # Session Configuration
    session_id: Optional[str] = None  # Set when session is active
    
    # Retry Configuration
    max_retries: int = 3
    retry_delay_seconds: float = 1.0
    request_timeout_seconds: float = 30.0
    
    # Face Detection
    min_face_size: int = 80  # Minimum face size in pixels
    detection_confidence: float = 0.5
    
    # Display
    show_preview: bool = True
    draw_faces: bool = True


def get_config() -> EdgeAgentConfig:
    """Get Edge Agent configuration."""
    return EdgeAgentConfig()
