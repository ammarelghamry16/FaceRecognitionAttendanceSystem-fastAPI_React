"""
Pose Classifier for face pose detection and classification.
Classifies face poses into categories for multi-angle enrollment.
"""
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Set
import numpy as np
import logging

logger = logging.getLogger(__name__)


class PoseCategory(str, Enum):
    """Face pose categories for enrollment."""
    FRONT = "front"           # yaw: -15° to 15°
    LEFT_30 = "left_30"       # yaw: -45° to -15°
    RIGHT_30 = "right_30"     # yaw: 15° to 45°
    UP_15 = "up_15"           # pitch: 10° to 25°
    DOWN_15 = "down_15"       # pitch: -25° to -10°


@dataclass
class PoseInfo:
    """Face pose information."""
    yaw: float      # Left/right rotation in degrees (-90 to 90)
    pitch: float    # Up/down rotation in degrees (-90 to 90)
    roll: float     # Tilt in degrees (-90 to 90)
    category: PoseCategory
    
    @property
    def is_frontal(self) -> bool:
        """Check if pose is approximately frontal."""
        return self.category == PoseCategory.FRONT


class PoseClassifier:
    """
    Classifies face pose from landmarks or pose angles.
    
    Uses InsightFace's pose estimation or computes from landmarks.
    Classifies into 5 categories for multi-angle enrollment.
    """
    
    # Pose angle thresholds (in degrees)
    YAW_FRONT_THRESHOLD = 15.0
    YAW_SIDE_MIN = 15.0
    YAW_SIDE_MAX = 45.0
    PITCH_VERTICAL_MIN = 10.0
    PITCH_VERTICAL_MAX = 25.0
    
    # Required poses for complete enrollment
    REQUIRED_POSES = {PoseCategory.FRONT, PoseCategory.LEFT_30, PoseCategory.RIGHT_30}
    RECOMMENDED_POSES = {
        PoseCategory.FRONT, PoseCategory.LEFT_30, PoseCategory.RIGHT_30,
        PoseCategory.UP_15, PoseCategory.DOWN_15
    }
    MIN_REQUIRED_POSES = 3
    
    def classify_from_angles(self, yaw: float, pitch: float, roll: float = 0.0) -> PoseInfo:
        """
        Classify pose from Euler angles.
        
        Args:
            yaw: Left/right rotation (-90 to 90, negative = looking left)
            pitch: Up/down rotation (-90 to 90, negative = looking down)
            roll: Tilt rotation (usually ignored for classification)
            
        Returns:
            PoseInfo with classification
        """
        category = self._classify_angles(yaw, pitch)
        
        return PoseInfo(
            yaw=yaw,
            pitch=pitch,
            roll=roll,
            category=category
        )
    
    def classify_from_face(self, face) -> Optional[PoseInfo]:
        """
        Classify pose from InsightFace face object.
        
        Args:
            face: InsightFace Face object with pose attribute
            
        Returns:
            PoseInfo or None if pose not available
        """
        try:
            # InsightFace provides pose as [pitch, yaw, roll]
            if hasattr(face, 'pose') and face.pose is not None:
                pitch, yaw, roll = face.pose
                return self.classify_from_angles(yaw, pitch, roll)
            
            # Fallback: estimate from landmarks if available
            if hasattr(face, 'landmark_2d_106') and face.landmark_2d_106 is not None:
                return self._estimate_from_landmarks(face.landmark_2d_106)
            
            # Default to front if no pose info
            return PoseInfo(yaw=0.0, pitch=0.0, roll=0.0, category=PoseCategory.FRONT)
            
        except Exception as e:
            logger.warning(f"Pose classification failed: {e}")
            return None
    
    def _classify_angles(self, yaw: float, pitch: float) -> PoseCategory:
        """Classify pose category from yaw and pitch angles."""
        # Check vertical poses first (pitch takes priority for up/down)
        if pitch > self.PITCH_VERTICAL_MIN and pitch < self.PITCH_VERTICAL_MAX:
            return PoseCategory.UP_15
        elif pitch < -self.PITCH_VERTICAL_MIN and pitch > -self.PITCH_VERTICAL_MAX:
            return PoseCategory.DOWN_15
        
        # Check horizontal poses (yaw)
        if abs(yaw) < self.YAW_FRONT_THRESHOLD:
            return PoseCategory.FRONT
        elif yaw < -self.YAW_SIDE_MIN and yaw > -self.YAW_SIDE_MAX:
            return PoseCategory.LEFT_30
        elif yaw > self.YAW_SIDE_MIN and yaw < self.YAW_SIDE_MAX:
            return PoseCategory.RIGHT_30
        
        # Default to front for extreme angles (outside useful range)
        return PoseCategory.FRONT
    
    def _estimate_from_landmarks(self, landmarks: np.ndarray) -> PoseInfo:
        """
        Estimate pose from 2D facial landmarks.
        
        Uses nose tip and eye positions to estimate yaw/pitch.
        """
        try:
            # Simplified estimation using key landmark positions
            # Landmarks 106 format: indices for nose tip, left eye, right eye
            nose_tip = landmarks[86]  # Approximate nose tip
            left_eye = landmarks[35]   # Left eye center
            right_eye = landmarks[93]  # Right eye center
            
            # Estimate yaw from eye-nose horizontal offset
            eye_center_x = (left_eye[0] + right_eye[0]) / 2
            eye_width = abs(right_eye[0] - left_eye[0])
            
            if eye_width > 0:
                yaw_offset = (nose_tip[0] - eye_center_x) / eye_width
                yaw = yaw_offset * 45  # Scale to approximate degrees
            else:
                yaw = 0.0
            
            # Estimate pitch from nose-eye vertical offset
            eye_center_y = (left_eye[1] + right_eye[1]) / 2
            pitch_offset = (nose_tip[1] - eye_center_y) / eye_width if eye_width > 0 else 0
            pitch = pitch_offset * 30  # Scale to approximate degrees
            
            category = self._classify_angles(yaw, pitch)
            
            return PoseInfo(yaw=yaw, pitch=pitch, roll=0.0, category=category)
            
        except Exception as e:
            logger.warning(f"Landmark pose estimation failed: {e}")
            return PoseInfo(yaw=0.0, pitch=0.0, roll=0.0, category=PoseCategory.FRONT)
    
    def get_missing_categories(self, captured: List[PoseCategory]) -> List[PoseCategory]:
        """
        Return pose categories not yet captured.
        
        Args:
            captured: List of already captured pose categories
            
        Returns:
            List of missing recommended poses
        """
        captured_set = set(captured)
        return [pose for pose in self.RECOMMENDED_POSES if pose not in captured_set]
    
    def get_required_missing(self, captured: List[PoseCategory]) -> List[PoseCategory]:
        """Return required poses that are still missing."""
        captured_set = set(captured)
        return [pose for pose in self.REQUIRED_POSES if pose not in captured_set]
    
    def is_enrollment_complete(self, captured: List[PoseCategory]) -> bool:
        """
        Check if enrollment has sufficient pose coverage.
        
        Requires at least 3 distinct pose categories.
        """
        unique_poses = set(captured)
        return len(unique_poses) >= self.MIN_REQUIRED_POSES
    
    def get_pose_coverage_score(self, captured: List[PoseCategory]) -> float:
        """
        Calculate pose coverage score (0.0 to 1.0).
        
        1.0 = all 5 recommended poses captured
        """
        unique_poses = set(captured)
        return len(unique_poses) / len(self.RECOMMENDED_POSES)
