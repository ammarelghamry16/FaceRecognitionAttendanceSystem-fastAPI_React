"""
Schedule cache implementing Cache-Aside pattern.
"""
from typing import Optional, List, Any
import json
from uuid import UUID
from shared.cache.cache_manager import CacheManager


class ScheduleCache:
    """
    Cache manager for schedule data using Cache-Aside pattern.
    """
    
    def __init__(self):
        self.cache = CacheManager.get_instance()
        self.ttl = 300  # 5 minutes default TTL
    
    def _make_key(self, prefix: str, identifier: str) -> str:
        """Generate cache key."""
        return f"schedule:{prefix}:{identifier}"
    
    def get_student_schedule(self, student_id: UUID) -> Optional[List[dict]]:
        """
        Get cached schedule for a student.
        
        Args:
            student_id: UUID of the student
            
        Returns:
            Cached schedule or None
        """
        key = self._make_key("student", str(student_id))
        cached = self.cache.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def set_student_schedule(self, student_id: UUID, schedule: List[dict]) -> None:
        """
        Cache schedule for a student.
        
        Args:
            student_id: UUID of the student
            schedule: Schedule data to cache
        """
        key = self._make_key("student", str(student_id))
        self.cache.set(key, json.dumps(schedule, default=str), ttl=self.ttl)
    
    def get_mentor_schedule(self, mentor_id: UUID) -> Optional[List[dict]]:
        """
        Get cached schedule for a mentor.
        
        Args:
            mentor_id: UUID of the mentor
            
        Returns:
            Cached schedule or None
        """
        key = self._make_key("mentor", str(mentor_id))
        cached = self.cache.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def set_mentor_schedule(self, mentor_id: UUID, schedule: List[dict]) -> None:
        """
        Cache schedule for a mentor.
        
        Args:
            mentor_id: UUID of the mentor
            schedule: Schedule data to cache
        """
        key = self._make_key("mentor", str(mentor_id))
        self.cache.set(key, json.dumps(schedule, default=str), ttl=self.ttl)
    
    def get_full_schedule(self) -> Optional[List[dict]]:
        """
        Get cached full schedule.
        
        Returns:
            Cached full schedule or None
        """
        key = self._make_key("full", "all")
        cached = self.cache.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def set_full_schedule(self, schedule: List[dict]) -> None:
        """
        Cache full schedule.
        
        Args:
            schedule: Full schedule data to cache
        """
        key = self._make_key("full", "all")
        self.cache.set(key, json.dumps(schedule, default=str), ttl=self.ttl)
    
    def get_class(self, class_id: UUID) -> Optional[dict]:
        """
        Get cached class details.
        
        Args:
            class_id: UUID of the class
            
        Returns:
            Cached class or None
        """
        key = self._make_key("class", str(class_id))
        cached = self.cache.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def set_class(self, class_id: UUID, class_data: dict) -> None:
        """
        Cache class details.
        
        Args:
            class_id: UUID of the class
            class_data: Class data to cache
        """
        key = self._make_key("class", str(class_id))
        self.cache.set(key, json.dumps(class_data, default=str), ttl=self.ttl)
    
    def invalidate_student_schedule(self, student_id: UUID) -> None:
        """
        Invalidate cached schedule for a student.
        
        Args:
            student_id: UUID of the student
        """
        key = self._make_key("student", str(student_id))
        self.cache.delete(key)
    
    def invalidate_mentor_schedule(self, mentor_id: UUID) -> None:
        """
        Invalidate cached schedule for a mentor.
        
        Args:
            mentor_id: UUID of the mentor
        """
        key = self._make_key("mentor", str(mentor_id))
        self.cache.delete(key)
    
    def invalidate_full_schedule(self) -> None:
        """Invalidate cached full schedule."""
        key = self._make_key("full", "all")
        self.cache.delete(key)
    
    def invalidate_class(self, class_id: UUID) -> None:
        """
        Invalidate cached class details.
        
        Args:
            class_id: UUID of the class
        """
        key = self._make_key("class", str(class_id))
        self.cache.delete(key)
    
    def invalidate_all_schedules(self) -> None:
        """Invalidate all schedule caches."""
        self.cache.invalidate("schedule:*")
