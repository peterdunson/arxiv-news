import sys
import os
import time

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from renderarxiv.arxiv_client import search_arxiv
from database import SessionLocal, init_db
from models import Paper as DBPaper
import json

def scrape_latest_papers(max_results=5000):
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
        
        # Define major category groups to search
        categories = [
            "cs.*",      # All Computer Science
            "math.*",    # All Mathematics  
            "physics.*", # Physics subcategories
            "astro-ph.*",# Astrophysics
            "cond-mat.*",# Condensed Matter
            "quant-ph",  # Quantum Physics
            "gr-qc",     # General Relativity
            "hep-ex",    # High Energy Physics - Experiment
            "hep-lat",   # High Energy Physics - Lattice
            "hep-ph",    # High Energy Physics - Phenomenology
            "hep-th",    # High Energy Physics - Theory
            "nucl-ex",   # Nuclear - Experiment
            "nucl-th",   # Nuclear - Theory
            "nlin.*",    # Nonlinear Sciences
            "stat.*",    # Statistics
            "q-bio.*",   # Quantitative Biology
            "q-fin.*",   # Quantitative Finance
            "econ.*",    # Economics
            "eess.*",    # Electrical Engineering
        ]
        
        all_papers = []
        batch_size = 100
        batches_per_category = 5  # Get up to 500 papers per category

        # Search each category group
        for cat_num, category in enumerate(categories):
            print(f"\n📂 Category {cat_num + 1}/{len(categories)}: {category}")
            
            # Fetch multiple batches per category
            for batch_num in range(batches_per_category):
                papers = search_arxiv(
                    query=f"cat:{category}",
                    max_results=batch_size,
                    sort_by="submittedDate",
                    sort_order="descending",
                    start=batch_num * batch_size
                )
                
                if not papers:
                    print(f"   Batch {batch_num + 1}: No more papers (total: {batch_num * 100})")
                    break
                
                print(f"   Batch {batch_num + 1}: Retrieved {len(papers)} papers")
                all_papers.extend(papers)
                
                # Small delay between requests
                time.sleep(1)
            
            print(f"   ✓ Total from {category}: {len([p for p in all_papers if any(c.startswith(category.replace('*', '').replace('.*', '')) for c in p.categories)])} papers so far")
        
        print(f"\n✓ Retrieved {len(all_papers)} papers total from arXiv")
        
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
                continue
            
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
            if added % 50 == 0:
                db.commit()
                print(f"   💾 Committed {added} papers so far...")
        
        # Final commit
        db.commit()
        print(f"\n✓ Added {added} new papers (skipped {skipped} duplicates)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        
    finally:
        db.close()

if __name__ == "__main__":
    scrape_latest_papers(max_results=5000)