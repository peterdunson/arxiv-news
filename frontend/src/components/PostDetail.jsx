import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, getPostComments, addPostComment, votePostComment, deletePostComment } from '../api';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await getPost(postId);
      setPost(data);
    } catch (error) {
      console.error('Failed to load post:', error);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    try {
      const data = await getPostComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to comment');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await addPostComment(postId, newComment);
      setNewComment('');
      await loadComments();
      await loadPost();
    } catch (error) {
      console.error('Failed to add comment:', error);
      if (error.response?.status === 401) {
        alert('Please login to comment');
        navigate('/login');
      } else {
        alert('Failed to add comment. Please try again.');
      }
    }
    setCommentLoading(false);
  };

  const handleVoteComment = async (commentId) => {
    try {
      await votePostComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Failed to vote on comment:', error);
      if (error.response?.status === 401) {
        alert('Please login to vote');
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deletePostComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      if (error.response?.status === 401) {
        alert('Please login to delete');
        navigate('/login');
      }
    }
  };

  const handleReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to reply');
      navigate('/login');
      return;
    }

    setCommentLoading(true);
    try {
      await addPostComment(postId, replyText);
      setReplyText('');
      setReplyTo(null);
      await loadComments();
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('Failed to add reply. Please try again.');
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

  const renderComment = (comment, index = 0) => {
    const commentRow = (
      <tr key={comment.id} className="athing comtr">
        <td style={{ padding: '0' }}>
          <table style={{ border: '0', width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {/* Main comment content */}
                <td className="default" style={{ width: '100%' }}>
                  <div style={{ marginTop: '2px', marginBottom: '-10px' }}>
                    <span className="comhead">
                      <span style={{ color: '#828282' }}>
                        {index + 1}
                        {' | '}
                      </span>
                      <Link
                        to={`/user/${comment.username}`}
                        className="hnuser"
                        style={{ textDecoration: 'none' }}
                      >
                        {comment.username}
                      </Link>
                      <span className="age">
                        {' '}
                        {formatTimeAgo(comment.created_at)}
                      </span>
                      {' | '}
                      <a
                        onClick={() => handleVoteComment(comment.id)}
                        style={{ cursor: 'pointer', color: '#828282' }}
                      >
                        {comment.user_voted ? 'unvote' : 'upvote'}
                      </a>
                      {' | '}
                      <span className="score">{comment.vote_count} points</span>
                    </span>
                  </div>
                  <br />
                  <div className="comment">
                    <span className="c00">
                      <span>{comment.content}</span>
                      <div className="reply">
                        <p style={{ fontSize: '1' }}>
                          <u>
                            <a
                              onClick={() => setReplyTo(comment.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              reply
                            </a>
                          </u>
                          {localStorage.getItem('currentUser') &&
                           comment.username === JSON.parse(localStorage.getItem('currentUser')).username && (
                            <>
                              {' | '}
                              <u>
                                <a
                                  onClick={() => handleDeleteComment(comment.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  delete
                                </a>
                              </u>
                            </>
                          )}
                        </p>
                      </div>
                    </span>
                  </div>

                  {/* Reply form */}
                  {replyTo === comment.id && (
                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <form onSubmit={(e) => handleReply(e, comment.id)}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Add a reply..."
                          rows="4"
                          cols="60"
                          required
                          style={{ marginBottom: '8px' }}
                        />
                        <br />
                        <br />
                        <input
                          type="submit"
                          value={commentLoading ? 'Replying...' : 'reply'}
                          disabled={commentLoading}
                          style={{ cursor: 'pointer', marginRight: '5px' }}
                        />
                        <input
                          type="button"
                          value="cancel"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText('');
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    );

    return commentRow;
  };

  if (loading) {
    return <tr><td style={{ padding: '20px' }}>Loading...</td></tr>;
  }

  if (!post) {
    return (
      <tr>
        <td style={{ padding: '20px' }}>
          <p>Post not found</p>
          <p><Link to="/show">← back to show</Link></p>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ padding: '20px', fontFamily: 'Verdana, Geneva, sans-serif' }}>
        <table style={{ border: '0', fontFamily: 'Verdana, Geneva, sans-serif' }}>
          <tbody>
            <tr>
              <td>
                <span style={{ fontSize: '12pt', fontWeight: 'bold', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                  {post.url ? (
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                      {post.title}
                    </a>
                  ) : (
                    post.title
                  )}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ paddingTop: '5px', fontSize: '9pt', color: '#828282', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                {post.vote_count} points by{' '}
                <Link to={`/user/${post.username}`}>{post.username}</Link>{' '}
                {formatTimeAgo(post.created_at)}
              </td>
            </tr>
            {post.text && (
              <tr>
                <td style={{ paddingTop: '15px', paddingBottom: '15px', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '9pt', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                    {post.text}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add comment form */}
        <form onSubmit={handleAddComment} style={{ marginTop: '20px', marginBottom: '20px', fontFamily: 'Verdana, Geneva, sans-serif' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={6}
            cols={60}
            placeholder="Add a comment..."
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '8px',
              fontFamily: 'Verdana',
              fontSize: '10pt'
            }}
          />
          <br />
          <button
            type="submit"
            disabled={commentLoading || !newComment.trim()}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              fontFamily: 'Verdana',
              fontSize: '10pt',
              cursor: commentLoading || !newComment.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {commentLoading ? 'adding comment...' : 'add comment'}
          </button>
        </form>

        {/* Comments */}
        <table style={{ border: '0', width: '100%', marginTop: '20px' }}>
          <tbody>
            {comments.length === 0 ? (
              <tr>
                <td style={{ color: '#828282', fontSize: '10pt', fontFamily: 'Verdana, Geneva, sans-serif' }}>
                  No comments yet.
                </td>
              </tr>
            ) : (
              comments.map((comment, index) => renderComment(comment, index))
            )}
          </tbody>
        </table>

        <p style={{ marginTop: '20px', fontFamily: 'Verdana, Geneva, sans-serif' }}>
          <Link to="/show">← back to show</Link>
        </p>
      </td>
    </tr>
  );
}
