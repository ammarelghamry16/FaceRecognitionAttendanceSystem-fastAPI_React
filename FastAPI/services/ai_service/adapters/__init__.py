"""
Face Recognition Adapters implementing Adapter pattern.
Allows swapping between different face recognition libraries.
"""
from .base_adapter import IFaceRecognitionAdapter, FaceDetectionResult, RecognitionResult
from .insightface_adapter import InsightFaceAdapter

__all__ = [
    "IFaceRecognitionAdapter",
    "FaceDetectionResult",
    "RecognitionResult",
    "InsightFaceAdapter"
]
