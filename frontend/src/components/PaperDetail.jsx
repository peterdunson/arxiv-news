import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaper, getComments, addComment } from '../api';

export default function PaperDetail() {
  const { arxivId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });

  useEffect(() => {
    loadPaper();
    loadComments();
  }, [arxivId]);

  const loadPaper = async () => {
    setLoading(true);
    try {
      const data = await getPaper(arxivId);
      setPaper(data);
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

  const formatAuthors = (authors) => {
    if (authors.length === 0) return 'unknown';
    return authors[0].split(' ').pop();
  };

  if (loading) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center' }}>
          Loading paper...
        </td>
      </tr>
    );
  }

  if (!paper) {
    return (
      <tr>
        <td style={{ padding: '20px', textAlign: 'center' }}>
          <p>Paper not found</p>
          <p><a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Back to Feed</a></p>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ padding: '0px' }}>
        <table style={{ border: '0px', padding: '0px', borderCollapse: 'collapse', borderSpacing: '0px' }} className="itemlist">
          <tbody>
            {/* Paper Item */}
            <tr className="athing">
              <td style={{ verticalAlign: 'top' }} className="votelinks">
                <div style={{ textAlign: 'center', padding: '0 10px' }}>
                  <div className="votearrow" title="upvote" style={{ cursor: 'pointer' }} />
                </div>
              </td>
              <td className="title">
                <span className="storylink" style={{ fontWeight: 'bold' }}>
                  {paper.title}
                </span>
                <span className="sitebit comhead">
                  {' '}
                  (
                  <a href={paper.arxiv_url} target="_blank" rel="noopener noreferrer">
                    <span className="sitestr">arxiv.org</span>
                  </a>
                  )
                </span>
              </td>
            </tr>

            {/* Paper Details */}
            <tr>
              <td colSpan={1} />
              <td className="subtext">
                <span className="score">{paper.vote_count} points</span>
                {' by '}
                <a className="hnuser">{formatAuthors(paper.authors)}</a>
                {' '}
                <span className="age">{formatTimeAgo(paper.published)}</span>
                {' | '}
                <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>back</a>
                {' | '}
                <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">pdf</a>
                {' | '}
                <a href={paper.arxiv_url} target="_blank" rel="noopener noreferrer">arxiv</a>
                {' | '}
                {paper.comment_count === 0
                  ? 'discuss'
                  : paper.comment_count === 1
                  ? '1 comment'
                  : `${paper.comment_count} comments`}
              </td>
            </tr>

            {/* Spacer */}
            <tr style={{ height: '10px' }} />

            {/* Abstract */}
            <tr>
              <td colSpan={1} />
              <td>
                <div style={{ marginBottom: '10px', fontSize: '9pt' }}>
                  <p style={{ marginBottom: '10px' }}><b>Abstract:</b></p>
                  <p>{paper.abstract}</p>
                </div>
              </td>
            </tr>

            {/* Spacer */}
            <tr style={{ height: '10px' }} />

            {/* Add Comment Form */}
            <tr>
              <td colSpan={1} />
              <td>
                <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="username"
                      required
                      style={{ padding: '4px', width: '200px', marginRight: '10px' }}
                    />
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows="6"
                    cols="60"
                    required
                    style={{ marginBottom: '8px' }}
                  />
                  <br />
                  <input
                    type="submit"
                    value={commentLoading ? 'Adding comment...' : 'add comment'}
                    disabled={commentLoading}
                    style={{ cursor: 'pointer' }}
                  />
                </form>
              </td>
            </tr>

            {/* Comments */}
            {comments.map((comment) => (
              <tr key={comment.id} className="athing comtr">
                <td />
                <td>
                  <table style={{ border: '0' }}>
                    <tbody>
                      <tr>
                        <td className="default">
                          <div style={{ marginTop: '2px', marginBottom: '-10px' }}>
                            <span className="comhead">
                              <a className="hnuser">{comment.user_name}</a>
                              <span className="age">
                                {' '}
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </span>
                          </div>
                          <br />
                          <div className="comment">
                            <span className="c00">{comment.content}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
