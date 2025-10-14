import os
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db, init_db
from models import Paper, Vote, Comment
from pydantic import BaseModel

app = FastAPI(title="arXiv News API")

# Background task state
last_scrape_time = None

# CORS origins from environment variable or default to localhost
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-scraper background task
async def auto_scrape_papers():
    """Background task that scrapes arXiv papers once per day"""
    global last_scrape_time
    
    while True:
        try:
            # Run scraper
            print(f"🔄 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running automatic paper scraper...")
            
            # Import and run scraper
            from scraper import scrape_latest_papers
            scrape_latest_papers(max_results=100)  # Fetch more papers for daily updates
            
            last_scrape_time = datetime.now()
            print(f"✓ Scraper completed successfully. Next run in 24 hours.")
            
        except Exception as e:
            print(f"❌ Error in auto-scraper: {e}")
        
        # Wait 24 hours before next run
        await asyncio.sleep(24 * 60 * 60)  # 24 hours in seconds

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    
    # Run scraper immediately on startup
    print("🚀 Running initial paper scrape...")
    try:
        from scraper import scrape_latest_papers
        scrape_latest_papers(max_results=100)
        global last_scrape_time
        last_scrape_time = datetime.now()
        print("✓ Initial scrape completed")
    except Exception as e:
        print(f"⚠️ Initial scrape failed: {e}")
    
    # Start background task for daily updates
    asyncio.create_task(auto_scrape_papers())
    print("✓ Background scraper started (runs every 24 hours)")

# Pydantic models for API
class PaperResponse(BaseModel):
    id: int
    arxiv_id: str
    title: str
    authors: List[str]
    abstract: str
    pdf_url: str
    arxiv_url: str
    published: str
    categories: List[str]
    primary_category: str
    vote_count: int
    comment_count: int
    created_at: str
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    user_name: str
    content: str

class CommentResponse(BaseModel):
    id: int
    user_name: str
    content: str
    created_at: str
    
    class Config:
        from_attributes = True

# Routes
@app.get("/")
def root():
    return {"message": "arXiv News API"}

@app.get("/status")
def get_status(db: Session = Depends(get_db)):
    """Get API and scraper status"""
    global last_scrape_time
    
    paper_count = db.query(Paper).count()
    
    return {
        "status": "running",
        "total_papers": paper_count,
        "last_scrape": last_scrape_time.isoformat() if last_scrape_time else None,
        "next_scrape": (last_scrape_time + timedelta(hours=24)).isoformat() if last_scrape_time else None,
        "auto_scraper_enabled": True
    }

@app.get("/papers", response_model=List[PaperResponse])
def get_papers(
    skip: int = 0,
    limit: int = 20,
    sort: str = "votes",  # votes, recent, comments
    db: Session = Depends(get_db)
):
    """Get papers sorted by votes, recency, or comments"""
    query = db.query(Paper)
    
    if sort == "votes":
        query = query.order_by(Paper.vote_count.desc())
    elif sort == "recent":
        # Sort by published date (from arXiv), not created_at (when added to DB)
        query = query.order_by(Paper.published.desc())
    elif sort == "comments":
        query = query.order_by(Paper.comment_count.desc())
    
    papers = query.offset(skip).limit(limit).all()
    
    # Parse JSON strings back to lists
    result = []
    for paper in papers:
        paper_dict = {
            "id": paper.id,
            "arxiv_id": paper.arxiv_id,
            "title": paper.title,
            "authors": json.loads(paper.authors),
            "abstract": paper.abstract,
            "pdf_url": paper.pdf_url,
            "arxiv_url": paper.arxiv_url,
            "published": paper.published,
            "categories": json.loads(paper.categories),
            "primary_category": paper.primary_category,
            "vote_count": paper.vote_count,
            "comment_count": paper.comment_count,
            "created_at": paper.created_at.isoformat()
        }
        result.append(PaperResponse(**paper_dict))
    
    return result

@app.get("/papers/{arxiv_id}")
def get_paper(arxiv_id: str, db: Session = Depends(get_db)):
    """Get single paper by arXiv ID"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    return {
        "id": paper.id,
        "arxiv_id": paper.arxiv_id,
        "title": paper.title,
        "authors": json.loads(paper.authors),
        "abstract": paper.abstract,
        "pdf_url": paper.pdf_url,
        "arxiv_url": paper.arxiv_url,
        "published": paper.published,
        "categories": json.loads(paper.categories),
        "primary_category": paper.primary_category,
        "vote_count": paper.vote_count,
        "comment_count": paper.comment_count,
        "comment": paper.comment,
        "journal_ref": paper.journal_ref,
        "doi": paper.doi
    }

@app.post("/papers/{arxiv_id}/vote")
def vote_paper(
    arxiv_id: str,
    user_identifier: str,  # Will be IP or session
    db: Session = Depends(get_db)
):
    """Upvote a paper"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Check if already voted
    existing_vote = db.query(Vote).filter(
        Vote.paper_id == paper.id,
        Vote.user_identifier == user_identifier
    ).first()
    
    if existing_vote:
        # Remove vote (unvote)
        db.delete(existing_vote)
        paper.vote_count -= 1
    else:
        # Add vote
        vote = Vote(paper_id=paper.id, user_identifier=user_identifier)
        db.add(vote)
        paper.vote_count += 1
    
    db.commit()
    return {"vote_count": paper.vote_count}

@app.get("/papers/{arxiv_id}/comments", response_model=List[CommentResponse])
def get_comments(arxiv_id: str, db: Session = Depends(get_db)):
    """Get comments for a paper"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    comments = db.query(Comment).filter(Comment.paper_id == paper.id).order_by(Comment.created_at.desc()).all()
    
    return [
        CommentResponse(
            id=c.id,
            user_name=c.user_name,
            content=c.content,
            created_at=c.created_at.isoformat()
        )
        for c in comments
    ]

@app.post("/papers/{arxiv_id}/comments")
def add_comment(
    arxiv_id: str,
    comment_data: CommentCreate,
    db: Session = Depends(get_db)
):
    """Add a comment to a paper"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    comment = Comment(
        paper_id=paper.id,
        user_name=comment_data.user_name,
        content=comment_data.content
    )
    db.add(comment)
    paper.comment_count += 1
    db.commit()
    
    return {"message": "Comment added", "id": comment.id}