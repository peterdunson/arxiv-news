import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { votePaper } from '../api';

export default function PaperCard({ paper, rank }) {
  const navigate = useNavigate();
  const [votes, setVotes] = useState(paper.vote_count);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
    setVoted(!!votedPapers[paper.arxiv_id]);
  }, [paper.arxiv_id]);

  const handleVote = async (e) => {
    e.preventDefault();

    try {
      const result = await votePaper(paper.arxiv_id, 'anonymous');
      setVotes(result.vote_count);
      setVoted(result.user_voted);

      const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
      if (result.user_voted) {
        votedPapers[paper.arxiv_id] = true;
      } else {
        delete votedPapers[paper.arxiv_id];
      }
      localStorage.setItem('votedPapers', JSON.stringify(votedPapers));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const published = new Date(dateStr);
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} days ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  const getHostname = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'arxiv.org';
    }
  };

  const formatAuthors = (authors) => {
    // Handle if authors is a string (JSON) or already an array
    let authorList = authors;
    if (typeof authors === 'string') {
      try {
        authorList = JSON.parse(authors);
      } catch {
        return authors; // Return as-is if can't parse
      }
    }
    
    if (!Array.isArray(authorList) || authorList.length === 0) {
      return 'unknown';
    }
    
    // Show all authors, comma-separated
    return authorList.join(', ');
  };

  return (
    <>
      {/* Title Row */}
      <tr className="athing">
        <td style={{ textAlign: 'right', verticalAlign: 'top', paddingRight: '8px', paddingLeft: '5px', color: '#828282' }} className="title">
          <span className="rank">{rank}.</span>
        </td>
        <td style={{ verticalAlign: 'top', paddingRight: '3px', paddingLeft: '5px' }} className="votelinks">
          <a
            onClick={handleVote}
            style={{ cursor: 'pointer' }}
          >
            <div className={voted ? 'votearrow rotate180' : 'votearrow'} title={voted ? 'unvote' : 'upvote'} />
          </a>
        </td>
        <td className="title" style={{ paddingLeft: '0px' }}>
          <a
            className="storylink"
            href={`/paper/${paper.arxiv_id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/paper/${paper.arxiv_id}`);
            }}
            style={{ cursor: 'pointer' }}
          >
            {paper.title}
          </a>
          <span className="sitebit comhead">
            {' '}
            (
            <a href={paper.arxiv_url} target="_blank" rel="noopener noreferrer">
              <span className="sitestr">{getHostname(paper.arxiv_url)}</span>
            </a>
            )
          </span>
        </td>
      </tr>

      {/* Details Row */}
      <tr>
        <td colSpan={2} />
        <td className="subtext">
          <span className="score">{votes} points</span>
          {' by '}
          <a className="hnuser">{formatAuthors(paper.authors)}</a>
          {' '}
          <span className="age">
            <a onClick={() => navigate(`/paper/${paper.arxiv_id}`)} style={{ cursor: 'pointer' }}>
              {formatTimeAgo(paper.published)}
            </a>
          </span>
          {' | '}
          <a onClick={() => navigate(`/paper/${paper.arxiv_id}`)} style={{ cursor: 'pointer' }}>
            {paper.comment_count === 0
              ? 'discuss'
              : paper.comment_count === 1
              ? '1 comment'
              : `${paper.comment_count} comments`}
          </a>
        </td>
      </tr>

      {/* Spacer Row */}
      <tr className="spacer" style={{ height: 5 }} />
    </>
  );
}