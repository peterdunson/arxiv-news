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
      
      // Persist voted state
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
      await loadPaper(); // Reload to update comment count
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
      <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 py-8" style={{background: 'white', minHeight: '100vh', boxShadow: '0 0 50px rgba(0,0,0,0.1)'}}>
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="mt-6 text-gray-700 font-semibold text-lg">Loading paper...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 py-8" style={{background: 'white', minHeight: '100vh', boxShadow: '0 0 50px rgba(0,0,0,0.1)'}}>
          <div className="border border-gray-200 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paper not found</h2>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 text-white rounded-xl font-semibold hover:shadow-xl hover:-translate-y-1 transition-all transform"
              style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className="max-w-4xl mx-auto px-4 py-8" style={{background: 'white', minHeight: '100vh', boxShadow: '0 0 50px rgba(0,0,0,0.1)'}}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-gray-700 hover:text-purple-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-purple-50"
        >
          ← Back to Feed
        </button>

        {/* Paper details */}
        <div className="border border-gray-200 rounded-xl p-8 mb-8 shadow-md">
          <div className="flex gap-6 mb-6">
            {/* Vote button */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <button
                onClick={handleVote}
                className={`p-3 rounded-lg border-2 transition-all ${
                  voted
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-purple-500'
                }`}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3l2.5 6h6l-5 4 2 6-5.5-4-5.5 4 2-6-5-4h6z" />
                </svg>
              </button>
              <span className={`text-lg font-bold ${voted ? 'text-purple-600' : 'text-gray-700'}`}>{votes}</span>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{paper.title}</h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-6 text-sm mb-4">
                <span className="text-gray-600 font-medium">
                  👥 {paper.authors.slice(0, 5).join(', ')}{paper.authors.length > 5 ? ', et al.' : ''}
                </span>
                <span className="text-gray-500">📅 {formatDate(paper.published)}</span>
                <span className="text-gray-600">💬 <strong>{paper.comment_count}</strong> comments</span>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {paper.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1.5 text-white text-sm font-medium rounded-full"
                    style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
                    title={cat}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Optional metadata */}
              {paper.comment && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Note:</span> {paper.comment}
                </p>
              )}
              {paper.journal_ref && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Journal:</span> {paper.journal_ref}
                </p>
              )}
              {paper.doi && (
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold">DOI:</span>{' '}
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    {paper.doi}
                  </a>
                </p>
              )}

              {/* Links */}
              <div className="flex gap-4 mt-4">
                <a
                  href={paper.arxiv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border-2 border-purple-600 bg-white text-purple-600 rounded-lg font-semibold text-sm transition-all hover:bg-purple-600 hover:text-white hover:-translate-y-0.5 hover:shadow-md"
                >
                  📄 arXiv Page
                </a>
                <a
                  href={paper.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-white rounded-lg font-semibold text-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-0"
                  style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
                >
                  📥 Download PDF
                </a>
              </div>
            </div>
          </div>

          {/* Abstract */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">📝 Abstract</h2>
            <div className="bg-gray-50 border-l-4 p-5 rounded-lg" style={{borderLeftColor: '#667eea'}}>
              <p className="text-gray-700 text-sm leading-relaxed">{paper.abstract}</p>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="border-2 border-gray-300 rounded-xl p-10 shadow-lg bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            💬 Comments ({comments.length})
          </h2>

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="mb-10 bg-gray-50 p-8 rounded-lg border-2 border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Comment</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this paper..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={commentLoading}
              className="px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform disabled:opacity-50 disabled:cursor-not-allowed border-0 relative z-10"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {commentLoading ? 'Posting...' : '✍️ Post Comment'}
            </button>
          </form>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-400">
              <div className="text-4xl mb-3">💭</div>
              <p className="text-lg font-semibold text-gray-700 mb-2">No comments yet</p>
              <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                        {comment.user_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {comment.user_name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-12">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
