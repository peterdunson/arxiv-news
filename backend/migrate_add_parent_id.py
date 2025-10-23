"""
Migration script to add parent_id column to comments table for threaded comments
Run this once to update the production database
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./arxiv_news.db")

# Create engine
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        try:
            # Check if column already exists
            if "postgresql" in DATABASE_URL:
                result = conn.execute(text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name='comments' AND column_name='parent_id'
                """))
                if result.fetchone():
                    print("✓ Column 'parent_id' already exists. Migration not needed.")
                    return

                # Add parent_id column for PostgreSQL
                print("Adding parent_id column to comments table...")
                conn.execute(text("""
                    ALTER TABLE comments
                    ADD COLUMN parent_id INTEGER NULL
                    REFERENCES comments(id)
                """))
                conn.commit()
                print("✓ Successfully added parent_id column!")

            else:
                # SQLite
                result = conn.execute(text("PRAGMA table_info(comments)"))
                columns = [row[1] for row in result.fetchall()]
                if 'parent_id' in columns:
                    print("✓ Column 'parent_id' already exists. Migration not needed.")
                    return

                print("Adding parent_id column to comments table...")
                conn.execute(text("""
                    ALTER TABLE comments
                    ADD COLUMN parent_id INTEGER
                    REFERENCES comments(id)
                """))
                conn.commit()
                print("✓ Successfully added parent_id column!")

        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
