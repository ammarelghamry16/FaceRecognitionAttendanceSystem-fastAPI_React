"""
Migration script for Face Recognition Enhancements.
Adds new columns to face_encodings table and creates user_centroids table.

Run this script to apply the migration:
    python FastAPI/temp/migrate_face_recognition_enhancements.py

To rollback:
    python FastAPI/temp/migrate_face_recognition_enhancements.py --rollback
"""
import sys
from pathlib import Path

# Add FastAPI to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from shared.database.connection import DatabaseConnection


def upgrade():
    """Apply the migration - add new columns and create user_centroids table."""
    print("=" * 70)
    print("FACE RECOGNITION ENHANCEMENTS MIGRATION - UPGRADE")
    print("=" * 70)
    
    db_conn = DatabaseConnection()
    engine = db_conn.engine
    
    with engine.connect() as conn:
        # Step 1: Add new columns to face_encodings table
        print("\n[Step 1] Adding new columns to face_encodings table...")
        
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'face_encodings' 
            AND column_name IN ('quality_score', 'pose_category', 'is_adaptive')
        """))
        existing_columns = {row[0] for row in result.fetchall()}
        
        if 'quality_score' not in existing_columns:
            conn.execute(text("""
                ALTER TABLE face_encodings 
                ADD COLUMN quality_score FLOAT NOT NULL DEFAULT 0.0
            """))
            print("   ✅ Added quality_score column")
        else:
            print("   ⏭️  quality_score column already exists")
        
        if 'pose_category' not in existing_columns:
            conn.execute(text("""
                ALTER TABLE face_encodings 
                ADD COLUMN pose_category VARCHAR(20) NULL
            """))
            print("   ✅ Added pose_category column")
        else:
            print("   ⏭️  pose_category column already exists")
        
        if 'is_adaptive' not in existing_columns:
            conn.execute(text("""
                ALTER TABLE face_encodings 
                ADD COLUMN is_adaptive BOOLEAN DEFAULT FALSE
            """))
            print("   ✅ Added is_adaptive column")
        else:
            print("   ⏭️  is_adaptive column already exists")
        
        # Step 2: Create user_centroids table
        print("\n[Step 2] Creating user_centroids table...")
        
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_centroids'
            )
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            conn.execute(text("""
                CREATE TABLE user_centroids (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    centroid FLOAT[] NOT NULL,
                    embedding_count INTEGER NOT NULL DEFAULT 0,
                    avg_quality_score FLOAT NOT NULL DEFAULT 0.0,
                    pose_coverage VARCHAR[] NOT NULL DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                )
            """))
            print("   ✅ Created user_centroids table")
            
            # Create index on user_id for faster lookups
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_centroids_user_id 
                ON user_centroids(user_id)
            """))
            print("   ✅ Created index on user_centroids.user_id")
        else:
            print("   ⏭️  user_centroids table already exists")
        
        # Step 3: Migrate existing data - set quality_score from image_quality_score
        print("\n[Step 3] Migrating existing data...")
        
        result = conn.execute(text("""
            UPDATE face_encodings 
            SET quality_score = COALESCE(image_quality_score, 0.5)
            WHERE quality_score = 0.0 AND image_quality_score IS NOT NULL
        """))
        print(f"   ✅ Updated {result.rowcount} existing encodings with quality scores")
        
        conn.commit()
    
    print("\n" + "=" * 70)
    print("MIGRATION COMPLETE!")
    print("=" * 70)
    print("\nChanges applied:")
    print("   - face_encodings.quality_score (Float, NOT NULL, default 0.0)")
    print("   - face_encodings.pose_category (String(20), nullable)")
    print("   - face_encodings.is_adaptive (Boolean, default False)")
    print("   - user_centroids table (new)")


def downgrade():
    """Rollback the migration - remove new columns and drop user_centroids table."""
    print("=" * 70)
    print("FACE RECOGNITION ENHANCEMENTS MIGRATION - ROLLBACK")
    print("=" * 70)
    
    db_conn = DatabaseConnection()
    engine = db_conn.engine
    
    with engine.connect() as conn:
        # Step 1: Drop user_centroids table
        print("\n[Step 1] Dropping user_centroids table...")
        conn.execute(text("DROP TABLE IF EXISTS user_centroids CASCADE"))
        print("   ✅ Dropped user_centroids table")
        
        # Step 2: Remove new columns from face_encodings
        print("\n[Step 2] Removing new columns from face_encodings...")
        
        conn.execute(text("""
            ALTER TABLE face_encodings 
            DROP COLUMN IF EXISTS quality_score,
            DROP COLUMN IF EXISTS pose_category,
            DROP COLUMN IF EXISTS is_adaptive
        """))
        print("   ✅ Removed quality_score, pose_category, is_adaptive columns")
        
        conn.commit()
    
    print("\n" + "=" * 70)
    print("ROLLBACK COMPLETE!")
    print("=" * 70)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        downgrade()
    else:
        upgrade()
