import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from renderarxiv.arxiv_client import search_arxiv
from database import SessionLocal, init_db
from models import Paper as DBPaper
import json

def scrape_latest_papers(max_results=1000):
    """Fetch latest papers from arXiv and add to database"""
    
    init_db()
    db = SessionLocal()
    
    try:
        # Get the most recent paper we have in database
        latest_paper = db.query(DBPaper).order_by(DBPaper.published.desc()).first()
        
        if latest_paper:
            print(f"📅 Latest paper in DB: {latest_paper.title[:50]}... ({latest_paper.published})")
        else:
            print("📅 No papers in database yet")
        
        print("🔎 Fetching latest papers from arXiv...")
        
        # Fetch recent papers from arXiv
        papers = search_arxiv(
            query="all",
            max_results=max_results,
            sort_by="submittedDate",
            sort_order="descending"
        )
        
        print(f"✓ Retrieved {len(papers)} papers from arXiv")
        
        added = 0
        skipped = 0
        
        for paper in papers:
            # Check if paper already exists
            existing = db.query(DBPaper).filter(DBPaper.arxiv_id == paper.arxiv_id).first()
            
            if existing:
                skipped += 1
                continue  # Skip duplicates
            
            # Add new paper to database
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
            
            # Commit every 10 papers for safety
            if added % 10 == 0:
                db.commit()
        
        # Final commit
        db.commit()
        print(f"✓ Added {added} new papers (skipped {skipped} duplicates)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    scrape_latest_papers(max_results=1000)