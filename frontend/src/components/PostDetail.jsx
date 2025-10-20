import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, getPostComments, addPostComment } from '../api';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

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
      <td style={{ padding: '20px' }}>
        <table style={{ border: '0' }}>
          <tbody>
            <tr>
              <td>
                <span style={{ fontSize: '12pt', fontWeight: 'bold' }}>
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
              <td style={{ paddingTop: '5px', fontSize: '9pt', color: '#828282' }}>
                {post.vote_count} points by{' '}
                <Link to={`/user/${post.username}`}>{post.username}</Link>{' '}
                {formatTimeAgo(post.created_at)}
              </td>
            </tr>
            {post.text && (
              <tr>
                <td style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '10pt' }}>
                    {post.text}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add comment form */}
        <form onSubmit={handleAddComment} style={{ marginTop: '20px', marginBottom: '20px' }}>
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
        <div style={{ marginTop: '20px' }}>
          {comments.length === 0 ? (
            <p style={{ color: '#828282', fontSize: '10pt' }}>No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <table key={comment.id} style={{ border: '0', marginBottom: '15px', width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'top', paddingRight: '8px', width: '20px' }}>
                      <div style={{ width: '10px', height: '10px' }} />
                    </td>
                    <td>
                      <table style={{ border: '0' }}>
                        <tbody>
                          <tr>
                            <td className="default">
                              <div style={{ marginTop: '2px', marginBottom: '-10px' }}>
                                <span className="comhead">
                                  <Link to={`/user/${comment.username}`}>{comment.username}</Link>{' '}
                                  <span className="age">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </span>
                              </div>
                              <br />
                              <div className="comment">
                                <span className="commtext c00">
                                  <div style={{ whiteSpace: 'pre-wrap' }}>
                                    {comment.content}
                                  </div>
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))
          )}
        </div>

        <p style={{ marginTop: '20px' }}>
          <Link to="/show">← back to show</Link>
        </p>
      </td>
    </tr>
  );
}
