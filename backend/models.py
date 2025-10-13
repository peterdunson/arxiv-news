import sqlalchemy
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Paper(Base):
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    authors = Column(Text, nullable=False)  # JSON array as string
    abstract = Column(Text, nullable=False)
    pdf_url = Column(String, nullable=False)
    arxiv_url = Column(String, nullable=False)
    published = Column(String, nullable=False)  # ISO date string
    updated = Column(String, nullable=False)
    categories = Column(Text, nullable=False)  # JSON array as string
    primary_category = Column(String, nullable=False)
    comment = Column(Text, nullable=True)
    journal_ref = Column(Text, nullable=True)
    doi = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    vote_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Relationships
    votes = relationship("Vote", back_populates="paper", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="paper", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    user_identifier = Column(String, nullable=False)  # IP or user session
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    paper = relationship("Paper", back_populates="votes")
    
    # Unique constraint: one vote per user per paper
    __table_args__ = (
        sqlalchemy.UniqueConstraint('paper_id', 'user_identifier', name='_paper_user_uc'),
    )


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    user_name = Column(String, nullable=False)  # Anonymous username
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    paper = relationship("Paper", back_populates="comments")