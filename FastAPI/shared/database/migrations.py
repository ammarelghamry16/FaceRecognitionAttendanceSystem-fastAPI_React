from sqlalchemy import inspect
from .connection import DatabaseConnection
from .base import Base
import logging

logger = logging.getLogger(__name__)


class DatabaseMigrations:
    """Utility class for database migrations and table creation"""

    def __init__(self):
        self.db_connection = DatabaseConnection()

    def create_all_tables(self) -> None:
        """Create all tables defined in models"""
        try:
            Base.metadata.create_all(bind=self.db_connection.engine)
            logger.info("All database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise

    def drop_all_tables(self) -> None:
        """Drop all tables (use with caution!)"""
        try:
            Base.metadata.drop_all(bind=self.db_connection.engine)
            logger.info("All database tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop database tables: {e}")
            raise

    def get_table_names(self) -> list:
        """Get list of existing table names"""
        inspector = inspect(self.db_connection.engine)
        return inspector.get_table_names()

    def table_exists(self, table_name: str) -> bool:
        """Check if a specific table exists"""
        return table_name in self.get_table_names()


# Convenience function for migrations
def create_tables():
    """Create all database tables"""
    migrations = DatabaseMigrations()
    migrations.create_all_tables()


def drop_tables():
    """Drop all database tables"""
    migrations = DatabaseMigrations()
    migrations.drop_all_tables()
