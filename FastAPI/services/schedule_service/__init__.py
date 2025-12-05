"""
Schedule Service - Manages courses, classes, and student enrollments.
Uses Repository pattern for data access and simple service methods for business logic.
"""
from .api.routes import router
from .services import ScheduleService, EnrollmentService

__all__ = ['router', 'ScheduleService', 'EnrollmentService']
