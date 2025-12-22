"""
Quality Analyzer for face image quality assessment.
Evaluates sharpness, lighting, and face visibility for enrollment decisions.
"""
from dataclasses import dataclass
from typing import Optional, Tuple
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)


@dataclass
class QualityMetrics:
    """Result of face image quality analysis."""
    overall_score: float      # 0.0 - 1.0, weighted combination
    sharpness: float          # 0.0 - 1.0, based on Laplacian variance
    lighting_uniformity: float # 0.0 - 1.0, based on histogram analysis
    face_size_ratio: float    # Face area / image area
    detection_confidence: float  # From face detector
    rejection_reason: Optional[str] = None


class QualityAnalyzer:
    """
    Analyzes face image quality for enrollment decisions.
    
    Uses multiple metrics:
    - Sharpness: Laplacian variance (detects blur)
    - Lighting: Histogram uniformity (detects over/under exposure)
    - Face size: Ratio of face area to image area
    """
    
    # Quality thresholds - balanced for accuracy and usability
    MIN_QUALITY_SCORE = 0.5  # Lowered for better acceptance
    MIN_FACE_SIZE_RATIO = 0.02  # 2% minimum - allows faces at normal webcam distance
    MIN_DETECTION_CONFIDENCE = 0.6  # Slightly lower confidence threshold
    
    # Weights for overall score calculation
    WEIGHT_SHARPNESS = 0.30
    WEIGHT_LIGHTING = 0.25
    WEIGHT_FACE_SIZE = 0.20
    WEIGHT_CONFIDENCE = 0.25
    
    # Sharpness calibration (Laplacian variance thresholds)
    SHARPNESS_MIN = 30.0    # Below this = very blurry (lowered)
    SHARPNESS_MAX = 500.0   # Above this = very sharp
    
    def analyze(
        self, 
        image: np.ndarray, 
        face_bbox: Tuple[int, int, int, int],
        detection_confidence: float
    ) -> QualityMetrics:
        """
        Compute quality metrics for a face image.
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            face_bbox: Face bounding box (x, y, width, height)
            detection_confidence: Confidence score from face detector
            
        Returns:
            QualityMetrics with all computed scores
        """
        if image is None or len(image.shape) != 3:
            return QualityMetrics(
                overall_score=0.0,
                sharpness=0.0,
                lighting_uniformity=0.0,
                face_size_ratio=0.0,
                detection_confidence=0.0,
                rejection_reason="Invalid image format"
            )
        
        x, y, w, h = face_bbox
        
        # Extract face region
        face_region = image[y:y+h, x:x+w]
        if face_region.size == 0:
            return QualityMetrics(
                overall_score=0.0,
                sharpness=0.0,
                lighting_uniformity=0.0,
                face_size_ratio=0.0,
                detection_confidence=detection_confidence,
                rejection_reason="Invalid face region"
            )
        
        # Compute individual metrics
        sharpness = self._compute_sharpness(face_region)
        lighting = self._compute_lighting_uniformity(face_region)
        face_size_ratio = self._compute_face_size_ratio(image.shape, face_bbox)
        
        # Compute overall score as weighted average
        overall_score = (
            self.WEIGHT_SHARPNESS * sharpness +
            self.WEIGHT_LIGHTING * lighting +
            self.WEIGHT_FACE_SIZE * min(face_size_ratio / 0.3, 1.0) +  # Normalize to 0-1
            self.WEIGHT_CONFIDENCE * detection_confidence
        )
        
        # Clamp to [0, 1]
        overall_score = max(0.0, min(1.0, overall_score))
        
        return QualityMetrics(
            overall_score=overall_score,
            sharpness=sharpness,
            lighting_uniformity=lighting,
            face_size_ratio=face_size_ratio,
            detection_confidence=detection_confidence
        )
    
    def _compute_sharpness(self, face_region: np.ndarray) -> float:
        """
        Compute sharpness score using Laplacian variance.
        Higher variance = sharper image.
        """
        try:
            # Convert to grayscale
            if len(face_region.shape) == 3:
                gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
            else:
                gray = face_region
            
            # Compute Laplacian
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            variance = laplacian.var()
            
            # Normalize to 0-1 range
            if variance < self.SHARPNESS_MIN:
                return 0.0
            elif variance > self.SHARPNESS_MAX:
                return 1.0
            else:
                return (variance - self.SHARPNESS_MIN) / (self.SHARPNESS_MAX - self.SHARPNESS_MIN)
                
        except Exception as e:
            logger.warning(f"Sharpness computation failed: {e}")
            return 0.5  # Default to middle value
    
    def _compute_lighting_uniformity(self, face_region: np.ndarray) -> float:
        """
        Compute lighting uniformity using histogram analysis.
        Good lighting = well-distributed histogram.
        """
        try:
            # Convert to grayscale
            if len(face_region.shape) == 3:
                gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
            else:
                gray = face_region
            
            # Compute histogram
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            hist = hist.flatten() / hist.sum()  # Normalize
            
            # Compute entropy (higher = more uniform)
            hist = hist[hist > 0]  # Remove zeros for log
            entropy = -np.sum(hist * np.log2(hist))
            
            # Max entropy for 256 bins is 8 (log2(256))
            # Normalize to 0-1
            uniformity = entropy / 8.0
            
            # Also check for over/under exposure
            mean_brightness = gray.mean()
            if mean_brightness < 40 or mean_brightness > 220:
                uniformity *= 0.5  # Penalize extreme brightness
            
            return min(1.0, uniformity)
            
        except Exception as e:
            logger.warning(f"Lighting computation failed: {e}")
            return 0.5
    
    def _compute_face_size_ratio(
        self, 
        image_shape: Tuple[int, ...], 
        face_bbox: Tuple[int, int, int, int]
    ) -> float:
        """Compute ratio of face area to image area."""
        image_area = image_shape[0] * image_shape[1]
        if image_area == 0:
            return 0.0
        
        _, _, w, h = face_bbox
        face_area = w * h
        
        return face_area / image_area
    
    def is_acceptable(self, metrics: QualityMetrics, face_count: int = 1) -> Tuple[bool, Optional[str]]:
        """
        Check if image meets quality requirements for enrollment.
        
        Args:
            metrics: Computed quality metrics
            face_count: Number of faces detected in image
            
        Returns:
            Tuple of (is_acceptable, rejection_reason)
        """
        # Check for multiple faces
        if face_count > 1:
            return False, f"Multiple faces detected ({face_count}). Please ensure only one person is in frame."
        
        # Check detection confidence
        if metrics.detection_confidence < self.MIN_DETECTION_CONFIDENCE:
            return False, f"Face not clearly detected (confidence: {metrics.detection_confidence:.0%}). Please face the camera directly."
        
        # Check face size - provide helpful guidance
        if metrics.face_size_ratio < self.MIN_FACE_SIZE_RATIO:
            percentage = metrics.face_size_ratio * 100
            return False, f"Face too small ({percentage:.1f}%). Please move closer to the camera or ensure your face fills more of the frame."
        
        # Check overall quality
        if metrics.overall_score < self.MIN_QUALITY_SCORE:
            # Provide specific feedback based on what's wrong
            issues = []
            suggestions = []
            
            if metrics.sharpness < 0.3:
                issues.append("blurry image")
                suggestions.append("hold still")
            if metrics.lighting_uniformity < 0.3:
                issues.append("poor lighting")
                suggestions.append("improve lighting or face a light source")
            
            reason = f"Image quality insufficient ({metrics.overall_score:.0%})"
            if issues:
                reason += f": {', '.join(issues)}"
            if suggestions:
                reason += f". Try: {', '.join(suggestions)}"
            return False, reason
        
        return True, None
    
    def get_quality_feedback(self, metrics: QualityMetrics) -> dict:
        """
        Get detailed quality feedback for UI display.
        
        Returns dict with:
        - acceptable: bool
        - score: float (0-1)
        - issues: list of issue strings
        - suggestions: list of suggestion strings
        """
        issues = []
        suggestions = []
        
        if metrics.face_size_ratio < self.MIN_FACE_SIZE_RATIO:
            issues.append("Face too small")
            suggestions.append("Move closer to camera")
        
        if metrics.sharpness < 0.3:
            issues.append("Image is blurry")
            suggestions.append("Hold still while capturing")
        
        if metrics.lighting_uniformity < 0.3:
            issues.append("Poor lighting")
            suggestions.append("Face a light source or improve room lighting")
        
        if metrics.detection_confidence < self.MIN_DETECTION_CONFIDENCE:
            issues.append("Face not clearly visible")
            suggestions.append("Face the camera directly")
        
        return {
            "acceptable": len(issues) == 0 and metrics.overall_score >= self.MIN_QUALITY_SCORE,
            "score": metrics.overall_score,
            "face_size_percent": metrics.face_size_ratio * 100,
            "sharpness_percent": metrics.sharpness * 100,
            "lighting_percent": metrics.lighting_uniformity * 100,
            "confidence_percent": metrics.detection_confidence * 100,
            "issues": issues,
            "suggestions": suggestions
        }
