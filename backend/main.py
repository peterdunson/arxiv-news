import os
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import json
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

from database import get_db, init_db
from models import Paper, Vote, Comment, User, CommentVote, Post, PostVote, PostComment

app = FastAPI(title="arXiv News API")

# Background task state
last_scrape_time = None

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

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

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    print("✓ Database initialized")
    
    # Start background scraper AFTER app is healthy
    asyncio.create_task(delayed_auto_scraper())

async def delayed_auto_scraper():
    """Wait for app to start, then run daily scraper"""
    global last_scrape_time
    
    # Wait 30 seconds for app to be healthy first
    print("⏳ Waiting 30 seconds before starting scraper...")
    await asyncio.sleep(30)
    
    while True:
        try:
            print(f"🔄 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running automatic paper scraper...")
            
            # Run scraper in thread pool (non-blocking)
            from scraper import scrape_latest_papers
            import concurrent.futures
            
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as pool:
                await loop.run_in_executor(pool, scrape_latest_papers, 500)
            
            last_scrape_time = datetime.now()
            print(f"✓ Scraper completed successfully. Next run in 24 hours.")
            
        except Exception as e:
            print(f"❌ Error in auto-scraper: {e}")
        
        # Wait 24 hours before next run
        await asyncio.sleep(24 * 60 * 60)

# Authentication helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        print(f"Attempting to decode token: {token[:20]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded payload: {payload}")
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            print("No 'sub' field in payload")
            raise credentials_exception
        user_id = int(user_id_str)
        print(f"User ID from token: {user_id}")
    except JWTError as e:
        print(f"JWT decode error: {e}")
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"No user found with ID: {user_id}")
        raise credentials_exception
    print(f"Found user: {user.username}")
    return user

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None

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
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    user_id: int
    username: str
    content: str
    vote_count: int
    created_at: str
    user_voted: bool = False
    replies: List['CommentResponse'] = []

    class Config:
        from_attributes = True

# Enable forward reference for recursive model
CommentResponse.model_rebuild()

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    bio: Optional[str]
    karma: int
    created_at: str

    class Config:
        from_attributes = True

class UserPublicProfile(BaseModel):
    username: str
    bio: Optional[str]
    karma: int
    created_at: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    bio: Optional[str] = None

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

@app.get("/sitemap.xml")
def get_sitemap(db: Session = Depends(get_db)):
    """Generate sitemap for SEO"""
    from fastapi.responses import Response

    papers = db.query(Paper).order_by(Paper.created_at.desc()).limit(1000).all()

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    # Homepage
    xml += '  <url>\n'
    xml += '    <loc>https://arxiv-news.com/</loc>\n'
    xml += '    <changefreq>hourly</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'

    # Category pages
    categories = ['all', 'cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.RO', 'stat.ML', 'math', 'physics', 'quant-ph']
    for cat in categories:
        xml += '  <url>\n'
        xml += f'    <loc>https://arxiv-news.com/?cat={cat}</loc>\n'
        xml += '    <changefreq>daily</changefreq>\n'
        xml += '    <priority>0.8</priority>\n'
        xml += '  </url>\n'

    # Paper pages
    for paper in papers:
        xml += '  <url>\n'
        xml += f'    <loc>https://arxiv-news.com/paper/{paper.arxiv_id}</loc>\n'
        xml += f'    <lastmod>{paper.created_at.strftime("%Y-%m-%d")}</lastmod>\n'
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.6</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'

    return Response(content=xml, media_type="application/xml")

@app.post("/admin/scrape")
def manual_scrape(max_results: int = 500, db: Session = Depends(get_db)):
    """Manually trigger a scrape (admin endpoint)"""
    try:
        from scraper import scrape_latest_papers
        scrape_latest_papers(max_results=max_results)

        global last_scrape_time
        last_scrape_time = datetime.now()

        paper_count = db.query(Paper).count()
        return {
            "status": "success",
            "message": f"Scrape completed",
            "total_papers": paper_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")

@app.post("/admin/migrate-comments")
def migrate_comments_table(db: Session = Depends(get_db)):
    """One-time migration to update comments table schema"""
    try:
        from sqlalchemy import text

        # Drop old tables
        db.execute(text("DROP TABLE IF EXISTS comment_votes CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS comments CASCADE"))

        # Create new comments table
        db.execute(text("""
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
        db.execute(text("""
            CREATE TABLE comment_votes (
                id SERIAL PRIMARY KEY,
                comment_id INTEGER NOT NULL REFERENCES comments(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(comment_id, user_id)
            )
        """))

        # Reset comment counts
        db.execute(text("UPDATE papers SET comment_count = 0"))

        db.commit()

        return {
            "status": "success",
            "message": "Comments table migrated successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

# Auth routes
@app.post("/auth/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if not user_data.username.isalnum() or len(user_data.username) < 3 or len(user_data.username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3-20 alphanumeric characters")

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=User.hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            bio=user.bio,
            karma=user.karma,
            created_at=user.created_at.isoformat()
        )
    }

@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not user.verify_password(login_data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            bio=user.bio,
            karma=user.karma,
            created_at=user.created_at.isoformat()
        )
    }

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        karma=current_user.karma,
        created_at=current_user.created_at.isoformat()
    )

@app.get("/users/{username}", response_model=UserPublicProfile)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserPublicProfile(
        username=user.username,
        bio=user.bio,
        karma=user.karma,
        created_at=user.created_at.isoformat()
    )

@app.patch("/users/me", response_model=UserResponse)
def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.bio is not None:
        if len(update_data.bio) > 160:
            raise HTTPException(status_code=400, detail="Bio must be 160 characters or less")
        current_user.bio = update_data.bio

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        bio=current_user.bio,
        karma=current_user.karma,
        created_at=current_user.created_at.isoformat()
    )

@app.get("/papers", response_model=List[PaperResponse])
def get_papers(
    skip: int = 0,
    limit: int = 15000,
    sort: str = "votes",  # votes, recent, comments
    db: Session = Depends(get_db)
):
    """Get papers sorted by votes, recency, or comments (newest 5000 only)"""
    
    # Only get papers from the most recent 5000 by publication date
    recent_papers_subquery = (
        db.query(Paper.id)
        .order_by(Paper.published.desc())
        .limit(15000)
        .subquery()
    )

    query = db.query(Paper).filter(Paper.id.in_(select(recent_papers_subquery.c.id)))
    
    if sort == "votes":
        query = query.order_by(Paper.vote_count.desc())
    elif sort == "recent":
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
    user_identifier: str,  # Can be anonymous or user_id
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Upvote a paper (works for both logged in and anonymous users)"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Use user_id if logged in, otherwise use anonymous identifier
    vote_identifier = str(current_user.id) if current_user else user_identifier

    # Check if already voted
    existing_vote = db.query(Vote).filter(
        Vote.paper_id == paper.id,
        Vote.user_identifier == vote_identifier
    ).first()

    if existing_vote:
        # Remove vote (unvote)
        db.delete(existing_vote)
        paper.vote_count -= 1
    else:
        # Add vote
        vote = Vote(paper_id=paper.id, user_identifier=vote_identifier)
        db.add(vote)
        paper.vote_count += 1

    db.commit()
    return {"vote_count": paper.vote_count, "user_voted": not existing_vote}

@app.get("/papers/{arxiv_id}/comments", response_model=List[CommentResponse])
def get_comments(
    arxiv_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get comments for a paper"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Only get top-level comments (parent_id is null)
    comments = db.query(Comment).filter(
        Comment.paper_id == paper.id,
        Comment.parent_id == None
    ).order_by(Comment.created_at.desc()).all()

    # Get user's comment votes if logged in
    user_votes = set()
    if current_user:
        votes = db.query(CommentVote.comment_id).filter(CommentVote.user_id == current_user.id).all()
        user_votes = {v.comment_id for v in votes}

    def build_comment_tree(comment):
        """Recursively build comment tree with replies"""
        user = db.query(User).filter(User.id == comment.user_id).first()

        # Get replies
        replies = db.query(Comment).filter(Comment.parent_id == comment.id).order_by(Comment.created_at.asc()).all()

        # Debug logging
        print(f"Comment {comment.id}: Found {len(replies)} replies")
        if len(replies) > 0:
            print(f"  Reply IDs: {[r.id for r in replies]}")

        return {
            "id": comment.id,
            "user_id": comment.user_id,
            "username": user.username if user else "deleted",
            "content": comment.content,
            "vote_count": comment.vote_count,
            "created_at": comment.created_at.isoformat(),
            "user_voted": comment.id in user_votes,
            "replies": [build_comment_tree(reply) for reply in replies]
        }

    result = [build_comment_tree(c) for c in comments]

    return result

@app.post("/papers/{arxiv_id}/comments")
def add_comment(
    arxiv_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a comment to a paper"""
    paper = db.query(Paper).filter(Paper.arxiv_id == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Validate parent comment exists if parent_id is provided
    if comment_data.parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment_data.parent_id).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = Comment(
        paper_id=paper.id,
        user_id=current_user.id,
        content=comment_data.content,
        parent_id=comment_data.parent_id
    )
    db.add(comment)
    paper.comment_count += 1
    db.commit()

    return {"message": "Comment added", "id": comment.id}

@app.post("/comments/{comment_id}/vote")
def vote_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing_vote = db.query(CommentVote).filter(
        CommentVote.comment_id == comment_id,
        CommentVote.user_id == current_user.id
    ).first()

    if existing_vote:
        db.delete(existing_vote)
        comment.vote_count -= 1

        commenter = db.query(User).filter(User.id == comment.user_id).first()
        if commenter:
            commenter.karma -= 1
    else:
        vote = CommentVote(comment_id=comment_id, user_id=current_user.id)
        db.add(vote)
        comment.vote_count += 1

        commenter = db.query(User).filter(User.id == comment.user_id).first()
        if commenter:
            commenter.karma += 1

    db.commit()
    return {"vote_count": comment.vote_count, "user_voted": not existing_vote}

@app.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only by the comment author)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only allow the comment author to delete
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    # Get the paper to update comment count
    paper = db.query(Paper).filter(Paper.id == comment.paper_id).first()
    if paper:
        paper.comment_count -= 1

    # Delete the comment
    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}


# Post (Show AN) endpoints
class PostCreate(BaseModel):
    title: str
    url: Optional[str] = None
    text: Optional[str] = None


@app.get("/posts")
def get_posts(
    sort: str = "hot",
    limit: int = 30,
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    if sort == "new":
        query = query.order_by(Post.created_at.desc())
    else:  # hot
        query = query.order_by(Post.vote_count.desc(), Post.created_at.desc())

    posts = query.limit(limit).all()

    result = []
    for post in posts:
        result.append({
            "id": post.id,
            "title": post.title,
            "url": post.url,
            "text": post.text,
            "vote_count": post.vote_count,
            "comment_count": post.comment_count,
            "created_at": post.created_at.isoformat(),
            "username": post.user.username,
            "user_id": post.user_id
        })

    return result


@app.post("/posts")
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate that at least url or text is provided
    if not post_data.url and not post_data.text:
        raise HTTPException(status_code=400, detail="Must provide either URL or text")

    post = Post(
        user_id=current_user.id,
        title=post_data.title,
        url=post_data.url,
        text=post_data.text
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        "id": post.id,
        "title": post.title,
        "url": post.url,
        "text": post.text,
        "vote_count": post.vote_count,
        "comment_count": post.comment_count,
        "created_at": post.created_at.isoformat(),
        "username": current_user.username,
        "user_id": current_user.id
    }


@app.get("/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return {
        "id": post.id,
        "title": post.title,
        "url": post.url,
        "text": post.text,
        "vote_count": post.vote_count,
        "comment_count": post.comment_count,
        "created_at": post.created_at.isoformat(),
        "username": post.user.username,
        "user_id": post.user_id
    }


@app.post("/posts/{post_id}/vote")
def vote_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_vote = db.query(PostVote).filter(
        PostVote.post_id == post_id,
        PostVote.user_id == current_user.id
    ).first()

    if existing_vote:
        db.delete(existing_vote)
        post.vote_count -= 1

        # Decrease poster's karma
        poster = db.query(User).filter(User.id == post.user_id).first()
        if poster:
            poster.karma -= 1
    else:
        vote = PostVote(post_id=post_id, user_id=current_user.id)
        db.add(vote)
        post.vote_count += 1

        # Increase poster's karma
        poster = db.query(User).filter(User.id == post.user_id).first()
        if poster:
            poster.karma += 1

    db.commit()
    return {"vote_count": post.vote_count, "user_voted": not existing_vote}


# Post comment endpoints
class PostCommentCreate(BaseModel):
    content: str


@app.get("/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    # Get current user if logged in
    token = None
    try:
        from fastapi import Request
        # This is a simplified check - in production you'd use proper dependency injection
        pass
    except:
        pass

    comments = db.query(PostComment).filter(PostComment.post_id == post_id).order_by(PostComment.created_at.desc()).all()

    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "content": comment.content,
            "vote_count": comment.vote_count,
            "created_at": comment.created_at.isoformat(),
            "username": comment.user.username,
            "user_id": comment.user_id
        })

    return result


@app.post("/posts/{post_id}/comments")
def add_post_comment(
    post_id: int,
    comment_data: PostCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content
    )

    db.add(comment)
    post.comment_count += 1
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "content": comment.content,
        "vote_count": comment.vote_count,
        "created_at": comment.created_at.isoformat(),
        "username": current_user.username,
        "user_id": current_user.id
    }
