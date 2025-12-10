"""
AI Service Module

Provides face recognition functionality:
- Face enrollment (storing face embeddings)
- Face recognition (matching against enrolled faces)
- Integration with Attendance Service

Uses InsightFace (buffalo_l model) for high accuracy recognition.

Usage:
    from services.ai_service.api import router as ai_router
    from services.ai_service.services import RecognitionService
"""
from .api.routes import router
from .services.recognition_service import RecognitionService, EnrollmentResult
from .adapters import InsightFaceAdapter, RecognitionResult

__all__ = [
    "router",
    "RecognitionService",
    "EnrollmentResult",
    "InsightFaceAdapter",
    "RecognitionResult"
]
