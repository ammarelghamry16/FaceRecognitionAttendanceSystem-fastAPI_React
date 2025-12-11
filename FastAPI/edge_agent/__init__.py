"""
Edge Agent Module

Standalone application for capturing camera frames and sending
them to the Face Recognition API for attendance marking.

Usage:
    python -m edge_agent.main --session <session_id>
    
Features:
    - OpenCV camera capture
    - Local face detection (pre-filter)
    - API communication with retry logic
    - Visual preview with face boxes
    - Duplicate detection (don't re-mark same person)
"""
from .agent import EdgeAgent
from .config import EdgeAgentConfig

__all__ = ["EdgeAgent", "EdgeAgentConfig"]