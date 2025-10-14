import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from renderarxiv.arxiv_client import search_arxiv
from database import SessionLocal
from models import Paper as DBPaper
import json

def scrape_latest_papers(max_results=50):
    """Fetch latest papers from arXiv and add to database"""
    db = SessionLocal()
    
    try:
        print("🔎 Fetching latest papers from arXiv...")
        
        # Use your existing renderarxiv to search - expanded categories
        papers = search_arxiv(
            query="cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:cs.RO OR cat:stat.ML OR cat:math.* OR cat:physics.* OR cat:quant-ph",
            max_results=max_results,
            sort_by="submittedDate",
            sort_order="descending"
        )
        
        added = 0
        for paper in papers:
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
    scrape_latest_papers()