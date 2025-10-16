import sys
import os
# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from renderarxiv.arxiv_client import search_arxiv
from database import SessionLocal, init_db
from models import Paper as DBPaper
import json

def scrape_latest_papers(max_results=500):
    """Fetch latest papers from arXiv and add to database"""
    
    # Initialize database tables if they don't exist
    init_db()
    
    db = SessionLocal()
    
    try:
        print("🔎 Fetching latest papers from arXiv...")
        
        # Fetch papers in batches (arXiv API returns max 100 per request)
        all_papers = []
        batch_size = 100
        batches = (max_results + batch_size - 1) // batch_size  # Round up
        
        for i in range(batches):
            batch = search_arxiv(
                query="all",
                max_results=batch_size,
                sort_by="submittedDate",
                sort_order="descending"
            )
            all_papers.extend(batch)
            if len(batch) < batch_size:
                break  # No more papers available
        
        print(f"✓ Retrieved {len(all_papers)} papers")
        
        added = 0
        for paper in all_papers[:max_results]:  # Limit to max_results
            # Check if exists
            if db.query(DBPaper).filter(DBPaper.arxiv_id == paper.arxiv_id).first():
                continue
            
            # Add to database
            new_paper = DBPaper(
                arxiv_id=paper.arxiv_id,
                title=paper.title,
                authors=json.dumps(paper.authors),
                abstract=paper.abstract,
                pdf_url=paper.pdf_url,
                arxiv_url=paper.arxiv_url,
                published=paper.published,
                updated=paper.updated,
                categories=json.dumps(paper.categories),
                primary_category=paper.primary_category,
                comment=paper.comment,
                journal_ref=paper.journal_ref,
                doi=paper.doi,
            )
            db.add(new_paper)
            added += 1
        
        db.commit()
        print(f"✓ Added {added} papers")
        
    finally:
        db.close()

if __name__ == "__main__":
    scrape_latest_papers(max_results=500)