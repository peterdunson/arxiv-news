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
                query="cat:cs.AI OR cat:cs.AR OR cat:cs.CC OR cat:cs.CE OR cat:cs.CG OR cat:cs.CL OR cat:cs.CR OR cat:cs.CV OR cat:cs.CY OR cat:cs.DB OR cat:cs.DC OR cat:cs.DL OR cat:cs.DM OR cat:cs.DS OR cat:cs.ET OR cat:cs.FL OR cat:cs.GL OR cat:cs.GR OR cat:cs.GT OR cat:cs.HC OR cat:cs.IR OR cat:cs.IT OR cat:cs.LG OR cat:cs.LO OR cat:cs.MA OR cat:cs.MM OR cat:cs.MS OR cat:cs.NA OR cat:cs.NE OR cat:cs.NI OR cat:cs.OH OR cat:cs.OS OR cat:cs.PF OR cat:cs.PL OR cat:cs.RO OR cat:cs.SC OR cat:cs.SD OR cat:cs.SE OR cat:cs.SI OR cat:cs.SY OR cat:math.AG OR cat:math.AT OR cat:math.AP OR cat:math.CT OR cat:math.CA OR cat:math.CO OR cat:math.AC OR cat:math.CV OR cat:math.DG OR cat:math.DS OR cat:math.FA OR cat:math.GM OR cat:math.GN OR cat:math.GT OR cat:math.GR OR cat:math.HO OR cat:math.IT OR cat:math.KT OR cat:math.LO OR cat:math.MP OR cat:math.MG OR cat:math.NT OR cat:math.NA OR cat:math.OA OR cat:math.OC OR cat:math.PR OR cat:math.QA OR cat:math.RT OR cat:math.RA OR cat:math.SP OR cat:math.ST OR cat:math.SG OR cat:astro-ph OR cat:astro-ph.CO OR cat:astro-ph.EP OR cat:astro-ph.GA OR cat:astro-ph.HE OR cat:astro-ph.IM OR cat:astro-ph.SR OR cat:cond-mat.dis-nn OR cat:cond-mat.mes-hall OR cat:cond-mat.mtrl-sci OR cat:cond-mat.other OR cat:cond-mat.quant-gas OR cat:cond-mat.soft OR cat:cond-mat.stat-mech OR cat:cond-mat.str-el OR cat:cond-mat.supr-con OR cat:gr-qc OR cat:hep-ex OR cat:hep-lat OR cat:hep-ph OR cat:hep-th OR cat:math-ph OR cat:nlin.AO OR cat:nlin.CD OR cat:nlin.CG OR cat:nlin.PS OR cat:nlin.SI OR cat:nucl-ex OR cat:nucl-th OR cat:physics.acc-ph OR cat:physics.ao-ph OR cat:physics.app-ph OR cat:physics.atm-clus OR cat:physics.atom-ph OR cat:physics.bio-ph OR cat:physics.chem-ph OR cat:physics.class-ph OR cat:physics.comp-ph OR cat:physics.data-an OR cat:physics.flu-dyn OR cat:physics.gen-ph OR cat:physics.geo-ph OR cat:physics.hist-ph OR cat:physics.ins-det OR cat:physics.med-ph OR cat:physics.optics OR cat:physics.ed-ph OR cat:physics.soc-ph OR cat:physics.plasm-ph OR cat:physics.pop-ph OR cat:physics.space-ph OR cat:quant-ph OR cat:stat.AP OR cat:stat.CO OR cat:stat.ML OR cat:stat.ME OR cat:stat.OT OR cat:stat.TH OR cat:eess.AS OR cat:eess.IV OR cat:eess.SP OR cat:eess.SY OR cat:econ.EM OR cat:econ.GN OR cat:econ.TH OR cat:q-bio.BM OR cat:q-bio.CB OR cat:q-bio.GN OR cat:q-bio.MN OR cat:q-bio.NC OR cat:q-bio.OT OR cat:q-bio.PE OR cat:q-bio.QM OR cat:q-bio.SC OR cat:q-bio.TO OR cat:q-fin.CP OR cat:q-fin.EC OR cat:q-fin.GN OR cat:q-fin.MF OR cat:q-fin.PM OR cat:q-fin.PR OR cat:q-fin.RM OR cat:q-fin.ST OR cat:q-fin.TR",
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