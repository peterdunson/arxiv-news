"""
Quick script to check if parent_id column exists and is properly configured
"""
import os
from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./arxiv_news.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking comments table schema...\n")

    # Get table info
    inspector = inspect(engine)
    columns = inspector.get_columns('comments')

    print("Columns in comments table:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']} (nullable={col['nullable']})")

    print("\n" + "="*50)
    print("Checking for existing comments with parent_id...")

    result = conn.execute(text("SELECT id, parent_id, content FROM comments WHERE parent_id IS NOT NULL LIMIT 5"))
    replies = result.fetchall()

    if replies:
        print(f"\nFound {len(replies)} replies:")
        for reply in replies:
            print(f"  Comment ID {reply[0]} is a reply to comment {reply[1]}")
            print(f"    Content: {reply[2][:50]}...")
    else:
        print("\nNo replies found in database yet.")

    print("\n" + "="*50)
    print("Checking total comments...")
    result = conn.execute(text("SELECT COUNT(*) FROM comments"))
    total = result.fetchone()[0]
    print(f"Total comments in database: {total}")
