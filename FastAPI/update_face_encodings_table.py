"""
Script to update face_encodings table with new columns.
Run: python update_face_encodings_table.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def update_table():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        return
    
    engine = create_engine(database_url)
    
    # SQL to add missing columns
    alter_statements = [
        # Rename 'version' to 'encoding_version' if it exists
        """
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='face_encodings' AND column_name='version') THEN
                ALTER TABLE face_encodings RENAME COLUMN version TO encoding_version;
            END IF;
        END $$;
        """,
        # Add encoding_version if it doesn't exist
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='encoding_version') THEN
                ALTER TABLE face_encodings ADD COLUMN encoding_version VARCHAR(50) DEFAULT 'insightface_v1';
            END IF;
        END $$;
        """,
        # Add image_quality_score
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='image_quality_score') THEN
                ALTER TABLE face_encodings ADD COLUMN image_quality_score FLOAT;
            END IF;
        END $$;
        """,
        # Add quality_score
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='quality_score') THEN
                ALTER TABLE face_encodings ADD COLUMN quality_score FLOAT DEFAULT 0.0 NOT NULL;
            END IF;
        END $$;
        """,
        # Add pose_category
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='pose_category') THEN
                ALTER TABLE face_encodings ADD COLUMN pose_category VARCHAR(20);
            END IF;
        END $$;
        """,
        # Add is_adaptive
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='is_adaptive') THEN
                ALTER TABLE face_encodings ADD COLUMN is_adaptive BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
        """,
        # Add source_image_path
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='source_image_path') THEN
                ALTER TABLE face_encodings ADD COLUMN source_image_path VARCHAR(500);
            END IF;
        END $$;
        """,
        # Add updated_at if missing
        """
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='face_encodings' AND column_name='updated_at') THEN
                ALTER TABLE face_encodings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            END IF;
        END $$;
        """,
        # Create user_centroids table if not exists
        """
        CREATE TABLE IF NOT EXISTS user_centroids (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            centroid FLOAT[] NOT NULL,
            embedding_count INTEGER NOT NULL DEFAULT 0,
            avg_quality_score FLOAT NOT NULL DEFAULT 0.0,
            pose_coverage VARCHAR[] NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
    ]
    
    with engine.connect() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"Warning: {e}")
                conn.rollback()
    
    print("✅ face_encodings table updated successfully!")
    
    # Verify columns
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'face_encodings'
            ORDER BY ordinal_position
        """))
        print("\nCurrent columns in face_encodings:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")

if __name__ == "__main__":
    update_table()
