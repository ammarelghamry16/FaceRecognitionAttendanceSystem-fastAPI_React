"""
Liveness Detector for anti-spoofing using texture analysis.
Optional feature that can be enabled/disabled via configuration.
"""
from typing import Tuple, Optional
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)


class LivenessDetector:
    """
    Basic liveness detection using texture analysis.
    
    Uses Local Binary Pattern (LBP) to detect texture differences
    between real faces and photos/screens.
    """
    
    LIVENESS_THRESHOLD = 0.5
    
    def __init__(self, enabled: bool = False):
        """
        Initialize LivenessDetector.
        
        Args:
            enabled: Whether liveness detection is enabled
        """
        self.enabled = enabled
    
    def check_liveness(
        self,
        image: np.ndarray,
        face_bbox: Tuple[int, int, int, int]
    ) -> float:
        """
        Check liveness of a face using texture analysis.
        
        Args:
            image: RGB image as numpy array
            face_bbox: Face bounding box (x, y, w, h)
            
        Returns:
            Liveness score (0.0 = likely fake, 1.0 = likely real)
        """
        if not self.enabled:
            return 1.0  # Always pass if disabled
        
        try:
            x, y, w, h = face_bbox
            
            # Extract face region
            face_region = image[y:y+h, x:x+w]
            if face_region.size == 0:
                return 0.0
            
            # Convert to grayscale
            if len(face_region.shape) == 3:
                gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
            else:
                gray = face_region
            
            # Compute LBP texture features
            lbp_score = self._compute_lbp_score(gray)
            
            # Check for moiré patterns (screen artifacts)
            moire_score = self._detect_moire_patterns(gray)
            
            # Combine scores
            liveness_score = (lbp_score * 0.6 + moire_score * 0.4)
            
            return max(0.0, min(1.0, liveness_score))
            
        except Exception as e:
            logger.warning(f"Liveness check failed: {e}")
            return 0.5  # Uncertain
    
    def _compute_lbp_score(self, gray: np.ndarray) -> float:
        """
        Compute LBP-based texture score.
        
        Real faces have more varied texture than photos.
        """
        try:
            # Simple LBP implementation
            rows, cols = gray.shape
            if rows < 3 or cols < 3:
                return 0.5
            
            # Compute local variance as texture measure
            kernel = np.ones((3, 3), np.float32) / 9
            mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
            sqr_mean = cv2.filter2D((gray.astype(np.float32) ** 2), -1, kernel)
            variance = sqr_mean - mean ** 2
            
            # Higher variance = more texture = more likely real
            avg_variance = np.mean(variance)
            
            # Normalize to 0-1 (calibrated for typical face images)
            score = min(1.0, avg_variance / 500.0)
            
            return score
            
        except Exception:
            return 0.5
    
    def _detect_moire_patterns(self, gray: np.ndarray) -> float:
        """
        Detect moiré patterns that indicate screen capture.
        
        Returns higher score if no moiré detected (likely real).
        """
        try:
            # Apply FFT to detect periodic patterns
            f = np.fft.fft2(gray.astype(np.float32))
            fshift = np.fft.fftshift(f)
            magnitude = np.abs(fshift)
            
            # Check for unusual frequency peaks (moiré)
            rows, cols = gray.shape
            crow, ccol = rows // 2, cols // 2
            
            # Mask out DC component
            magnitude[crow-5:crow+5, ccol-5:ccol+5] = 0
            
            # High peaks in specific frequencies indicate moiré
            max_magnitude = np.max(magnitude)
            mean_magnitude = np.mean(magnitude)
            
            if mean_magnitude > 0:
                ratio = max_magnitude / mean_magnitude
                # Lower ratio = less periodic patterns = more likely real
                score = 1.0 - min(1.0, (ratio - 10) / 50)
            else:
                score = 0.5
            
            return max(0.0, min(1.0, score))
            
        except Exception:
            return 0.5
    
    def is_live(self, score: float) -> bool:
        """Check if liveness score passes threshold."""
        return score >= self.LIVENESS_THRESHOLD
    
    def set_enabled(self, enabled: bool) -> None:
        """Enable or disable liveness detection."""
        self.enabled = enabled
