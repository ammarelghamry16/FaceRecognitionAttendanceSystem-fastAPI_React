"""
Face Recognition Adapters implementing Adapter pattern.
Allows swapping between different face recognition libraries.
"""
from .base_adapter import IFaceRecognitionAdapter, FaceDetectionResult, RecognitionResult
from .insightface_adapter import InsightFaceAdapter
from .face_recognition_adapter import FaceRecognitionAdapter

__all__ = [
    "IFaceRecognitionAdapter",
    "FaceDetectionResult",
    "RecognitionResult",
    "InsightFaceAdapter",
    "FaceRecognitionAdapter"
]


def get_best_available_adapter() -> IFaceRecognitionAdapter:
    """
    Get the best available face recognition adapter.
    Tries InsightFace first (more accurate), falls back to face_recognition (lighter).
    
    Returns:
        IFaceRecognitionAdapter: The best available adapter
        
    Raises:
        ImportError: If no face recognition library is available
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Try InsightFace first (more accurate, but heavier)
    try:
        import insightface
        logger.info("✅ InsightFace available - using InsightFaceAdapter")
        return InsightFaceAdapter()
    except ImportError:
        logger.warning("⚠️ InsightFace not available, trying face_recognition...")
    
    # Fall back to face_recognition (lighter, dlib-based)
    try:
        import face_recognition
        logger.info("✅ face_recognition available - using FaceRecognitionAdapter")
        return FaceRecognitionAdapter()
    except ImportError:
        logger.error("❌ Neither insightface nor face_recognition is available!")
        raise ImportError(
            "No face recognition library available. "
            "Install either 'insightface' or 'face_recognition': "
            "pip install face_recognition"
        )
