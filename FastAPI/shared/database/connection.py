import os
from typing import Optional
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """
    Singleton class for managing database connection.
    Ensures only one database connection instance exists throughout the application.
    """
    _instance: Optional['DatabaseConnection'] = None
    _engine: Optional[Engine] = None
    _session_factory: Optional[sessionmaker] = None

    def __new__(cls) -> 'DatabaseConnection':
        """Create or return existing instance (Singleton pattern)"""
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        """Initialize database connection"""
        try:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable is not set")

            # Create SQLAlchemy engine
            self._engine = create_engine(
                database_url,
                echo=os.getenv('DB_ECHO', 'false').lower() == 'true',  # Enable SQL logging if needed
                pool_pre_ping=True,  # Verify connections before use
                pool_recycle=300,    # Recycle connections every 5 minutes
            )

            # Create session factory
            self._session_factory = sessionmaker(
                bind=self._engine,
                autocommit=False,
                autoflush=False
            )

            logger.info("Database connection initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database connection: {e}")
            raise

    @property
    def engine(self) -> Engine:
        """Get database engine"""
        if self._engine is None:
            raise RuntimeError("Database connection not initialized")
        return self._engine

    @property
    def session_factory(self) -> sessionmaker:
        """Get session factory"""
        if self._session_factory is None:
            raise RuntimeError("Database connection not initialized")
        return self._session_factory

    def create_session(self) -> Session:
        """Create a new database session"""
        return self.session_factory()

    def close(self) -> None:
        """Close database connection"""
        if self._engine:
            self._engine.dispose()
            logger.info("Database connection closed")


def get_db_session() -> Session:
    """
    Dependency function to get database session.
    Use this with FastAPI's Depends() for dependency injection.
    """
    db_connection = DatabaseConnection()
    session = db_connection.create_session()
    try:
        yield session
        session.commit()
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()
