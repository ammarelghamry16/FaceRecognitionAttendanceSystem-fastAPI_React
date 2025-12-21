"""
Background tasks for attendance session management.
Handles auto-ending of expired sessions.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session
from shared.database.connection import get_db_session

logger = logging.getLogger(__name__)


async def check_and_end_expired_sessions():
    """
    Check for expired sessions and auto-end them.
    
    This task should be run periodically (e.g., every minute) to check
    for sessions that have exceeded their max_duration_minutes.
    """
    from ..repositories.session_repository import SessionRepository
    from ..services.attendance_service import AttendanceService
    
    db: Session = next(get_db_session())
    try:
        session_repo = SessionRepository(db)
        attendance_service = AttendanceService(db)
        
        # Find all active sessions
        active_sessions = session_repo.find_active_sessions()
        
        now = datetime.now(timezone.utc)
        ended_count = 0
        
        for session in active_sessions:
            # Check if session has exceeded max duration
            if session.max_duration_minutes:
                elapsed_minutes = (now - session.start_time).total_seconds() / 60
                
                if elapsed_minutes >= session.max_duration_minutes:
                    logger.info(
                        f"Auto-ending session {session.id} - "
                        f"elapsed {elapsed_minutes:.1f}min >= max {session.max_duration_minutes}min"
                    )
                    
                    attendance_service.end_session(
                        session_id=session.id,
                        ended_by=None,
                        auto_ended=True,
                        ended_reason="Duration expired"
                    )
                    ended_count += 1
        
        if ended_count > 0:
            db.commit()
            logger.info(f"Auto-ended {ended_count} expired sessions")
        
    except Exception as e:
        logger.error(f"Error checking expired sessions: {e}")
        db.rollback()
    finally:
        db.close()


async def session_cleanup_loop(interval_seconds: int = 60):
    """
    Background loop that periodically checks for expired sessions.
    
    Args:
        interval_seconds: How often to check (default: 60 seconds)
    """
    logger.info(f"Starting session cleanup loop (interval: {interval_seconds}s)")
    
    while True:
        try:
            await check_and_end_expired_sessions()
        except Exception as e:
            logger.error(f"Error in session cleanup loop: {e}")
        
        await asyncio.sleep(interval_seconds)


def start_session_cleanup_task():
    """
    Start the session cleanup background task.
    
    This should be called when the application starts.
    """
    asyncio.create_task(session_cleanup_loop())
    logger.info("Session cleanup background task started")
