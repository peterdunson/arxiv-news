import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaper, getComments, addComment, votePaper } from '../api';

export default function PaperDetail() {
  const { arxivId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });
  const [userId] = useState(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', id);
    }
    return id;
  });

  useEffect(() => {
    loadPaper();
    loadComments();
    checkIfVoted();
  }, [arxivId]);

  const checkIfVoted = () => {
    const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
    setVoted(!!votedPapers[arxivId]);
  };

  const loadPaper = async () => {
    setLoading(true);
    try {
      const data = await getPaper(arxivId);
      setPaper(data);
      setVotes(data.vote_count);
    } catch (error) {
      console.error('Failed to load paper:', error);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    try {
      const data = await getComments(arxivId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleVote = async () => {
    try {
      const result = await votePaper(arxivId, userId);
      setVotes(result.vote_count);
      const newVotedState = !voted;
      setVoted(newVotedState);
      
      const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
      if (newVotedState) {
        votedPapers[arxivId] = true;
      } else {
        delete votedPapers[arxivId];
      }
      localStorage.setItem('votedPapers', JSON.stringify(votedPapers));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;

    setCommentLoading(true);
    try {
      await addComment(arxivId, userName, newComment);
      setNewComment('');
      localStorage.setItem('userName', userName);
      await loadComments();
      await loadPaper();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
    setCommentLoading(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content opacity-60">Loading paper...</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
        <div className="card-body items-center text-center py-20">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="card-title">Paper not found</h2>
          <p className="text-base-content opacity-60">
            This paper doesn't exist or has been removed.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="btn btn-ghost btn-sm mb-4 gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Feed
      </button>

      {/* Paper Card */}
      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body">
          {/* Header with author info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
              <div>
                <p className="font-semibold">
                  {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ', et al.' : ''}
                </p>
                <p className="text-sm text-base-content opacity-60">{formatDate(paper.published)}</p>
              </div>
            </div>
            
            {/* Dropdown menu */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a>Save Paper</a></li>
                <li><a>Share</a></li>
                <li><a>Report</a></li>
              </ul>
            </div>
          </div>

          {/* Paper Title */}
          <h1 className="text-2xl font-bold mb-4">{paper.title}</h1>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {paper.categories.map((cat) => (
              <div key={cat} className="badge badge-primary badge-outline">
                {cat}
              </div>
            ))}
          </div>

          {/* Abstract */}
          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">📝 Abstract</h3>
            <p className="text-sm leading-relaxed">{paper.abstract}</p>
          </div>

          {/* Optional metadata */}
          {(paper.comment || paper.journal_ref || paper.doi) && (
            <div className="alert alert-info mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                {paper.comment && <p>💬 {paper.comment}</p>}
                {paper.journal_ref && <p>📖 {paper.journal_ref}</p>}
                {paper.doi && (
                  <p>
                    🔍 DOI:{' '}
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      {paper.doi}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="divider"></div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {/* Vote button */}
              <button
                onClick={handleVote}
                className={`btn gap-2 ${voted ? 'btn-primary' : 'btn-ghost'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {votes} Votes
              </button>

              {/* Comment count */}
              <button className="btn btn-ghost gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {paper.comment_count} Comments
              </button>

              {/* Share button */}
              <button className="btn btn-ghost gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share
              </button>
            </div>

            {/* Paper links */}
            <div className="flex gap-2">
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                PDF
              </a>
              <a
                href={paper.arxiv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-primary btn-sm"
              >
                arXiv
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">💬 Comments ({comments.length})</h2>

          {/* Add comment form */}
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <form onSubmit={handleAddComment}>
              <div className="form-control mb-3">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control mb-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this paper..."
                  rows="3"
                  className="textarea textarea-bordered"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={commentLoading}
                className="btn btn-primary w-full"
              >
                {commentLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Posting...
                  </>
                ) : (
                  '✍️ Post Comment'
                )}
              </button>
            </form>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💭</div>
              <p className="text-lg font-semibold mb-2">No comments yet</p>
              <p className="text-sm text-base-content opacity-60">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                  <div className="avatar placeholder flex-shrink-0">
                    <div className="bg-primary text-primary-content rounded-full w-10">
                      <span className="text-lg">{comment.user_name.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{comment.user_name}</span>
                      <span className="text-xs text-base-content opacity-60">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
