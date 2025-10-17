import sys
import os
import time

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
        
        # Fetch papers in batches with pagination
        all_papers = []
        batch_size = 100  # arXiv API limit per request
        num_batches = (max_results + batch_size - 1) // batch_size
        
        for batch_num in range(num_batches):
            print(f"   Batch {batch_num + 1}/{num_batches}...")
            
            # Fetch batch with offset - EMPTY QUERY GETS ALL PAPERS
            papers = search_arxiv(
                query="",  # Empty query = get ALL papers from ALL categories
                max_results=batch_size,
                sort_by="submittedDate",
                sort_order="descending",
                start=batch_num * batch_size
            )
            
            if not papers:
                print(f"   No more papers available")
                break
            
            all_papers.extend(papers)
            
            # Be nice to arXiv API - wait between requests
            if batch_num < num_batches - 1:
                time.sleep(3)
        
        print(f"✓ Retrieved {len(all_papers)} papers from arXiv")
        
        # Remove duplicates within fetched papers
        seen_ids = set()
        unique_papers = []
        for paper in all_papers:
            if paper.arxiv_id not in seen_ids:
                seen_ids.add(paper.arxiv_id)
                unique_papers.append(paper)
        
        print(f"✓ {len(unique_papers)} unique papers after deduplication")
        
        added = 0
        skipped = 0
        
        for paper in unique_papers:
            # Check if paper already exists in database
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