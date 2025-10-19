"""
Manual migration script to update comments table
Run this once to update the production database schema
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    exit(1)

# Fix Railway's postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

print("Running database migration...")

with engine.connect() as conn:
    # Start transaction
    trans = conn.begin()
    
    try:
        # Drop existing comments and comment_votes tables
        print("Dropping old comments and comment_votes tables...")
        conn.execute(text("DROP TABLE IF EXISTS comment_votes CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS comments CASCADE"))
        
        # Create new comments table with user_id
        print("Creating new comments table...")
        conn.execute(text("""
            CREATE TABLE comments (
                id SERIAL PRIMARY KEY,
                paper_id INTEGER NOT NULL REFERENCES papers(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                vote_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create comment_votes table
        print("Creating comment_votes table...")
        conn.execute(text("""
            CREATE TABLE comment_votes (
                id SERIAL PRIMARY KEY,
                comment_id INTEGER NOT NULL REFERENCES comments(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(comment_id, user_id)
            )
        """))
        
        # Reset comment counts on papers
        print("Resetting comment counts...")
        conn.execute(text("UPDATE papers SET comment_count = 0"))
        
        trans.commit()
        print("✓ Migration completed successfully!")
        
    except Exception as e:
        trans.rollback()
        print(f"✗ Migration failed: {e}")
        raise

print("Done!")
