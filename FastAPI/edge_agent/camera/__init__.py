"""
Camera module for Edge Agent.
"""
from .camera_adapter import ICameraAdapter
from .opencv_adapter import OpenCVCameraAdapter

__all__ = ["ICameraAdapter", "OpenCVCameraAdapter"]
