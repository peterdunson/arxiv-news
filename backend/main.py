from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db, init_db
from models import Paper, Vote, Comment
from pydantic import BaseModel

app = FastAPI(title="arXiv News API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

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
        query = query.order_by(Paper.created_at.desc())
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