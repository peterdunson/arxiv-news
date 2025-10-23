import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getPaper, getComments, addComment, votePaper, voteComment, deleteComment } from '../api';

export default function PaperDetail() {
  const { arxivId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [voted, setVoted] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // Track which comment we're replying to
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadPaper();
    loadComments();

    // Check if already voted
    const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
    setVoted(!!votedPapers[arxivId]);
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

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to comment');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await addComment(arxivId, newComment);
      setNewComment('');
      await loadComments();
      await loadPaper();
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

  const handleVotePaper = async (e) => {
    e.preventDefault();

    try {
      const result = await votePaper(arxivId, 'anonymous');
      setPaper({ ...paper, vote_count: result.vote_count });
      setVoted(result.user_voted);

      const votedPapers = JSON.parse(localStorage.getItem('votedPapers') || '{}');
      if (result.user_voted) {
        votedPapers[arxivId] = true;
      } else {
        delete votedPapers[arxivId];
      }
      localStorage.setItem('votedPapers', JSON.stringify(votedPapers));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleVoteComment = async (commentId) => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to vote');
      navigate('/login');
      return;
    }

    try {
      await voteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Failed to vote comment:', error);
      if (error.response?.status === 401) {
        alert('Please login to vote');
        navigate('/login');
      }
    }
  };

  const handleReply = async (e, parentId) => {
    e.preventDefault();

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to reply');
      navigate('/login');
      return;
    }

    if (!replyText.trim()) return;

    setCommentLoading(true);
    try {
      await addComment(arxivId, replyText, parentId);
      setReplyText('');
      setReplyTo(null);
      await loadComments();
      await loadPaper();
    } catch (error) {
      console.error('Failed to add reply:', error);
      if (error.response?.status === 401) {
        alert('Please login to reply');
        navigate('/login');
      } else {
        alert('Failed to add reply. Please try again.');
      }
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment(commentId);
      await loadComments();
      await loadPaper();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      if (error.response?.status === 403) {
        alert('You can only delete your own comments');
      } else if (error.response?.status === 401) {
        alert('Please login to delete comments');
        navigate('/login');
      } else {
        alert('Failed to delete comment. Please try again.');
      }
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

  const formatAuthors = (authors) => {
    if (authors.length === 0) return 'unknown';
    return authors[0].split(' ').pop();
  };

  // Recursive function to render comment and its replies
  const renderComment = (comment, depth = 0) => {
    const indentWidth = depth * 10; // Small indent per level

    return (
      <tr key={comment.id} className="athing comtr" style={depth > 0 ? { marginLeft: '-30px' } : {}}>
        <td style={{ verticalAlign: 'top', paddingLeft: depth > 0 ? '0px' : '10px' }}>
          <div style={{ textAlign: 'center', paddingTop: '4px' }}>
            <a
              onClick={() => handleVoteComment(comment.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={comment.user_voted ? 'votearrow rotate180' : 'votearrow'} title={comment.user_voted ? 'unvote' : 'upvote'} />
            </a>
          </div>
        </td>
        <td>
          <table style={{ border: '0' }}>
            <tbody>
              <tr>
                <td className="default">
                  <div style={{ marginTop: '2px', marginBottom: '-10px', marginLeft: `${indentWidth}px` }}>
                    <span className="comhead">
                      <a
                        onClick={() => navigate(`/user/${comment.username}`)}
                        className="hnuser"
                        style={{ cursor: 'pointer' }}
                      >
                        {comment.username}
                      </a>
                      <span className="age">
                        {' '}
                        {formatTimeAgo(comment.created_at)}
                      </span>
                      {' | '}
                      <span className="score">{comment.vote_count} points</span>
                    </span>
                  </div>
                  <br />
                  <div className="comment" style={{ marginLeft: `${indentWidth}px` }}>
                    <span className="c00">{comment.content}</span>
                    <p>
                      <a
                        onClick={() => setReplyTo(comment.id)}
                        style={{ cursor: 'pointer', fontSize: '10px', textDecoration: 'underline' }}
                      >
                        reply
                      </a>
                      {localStorage.getItem('currentUser') &&
                       comment.username === JSON.parse(localStorage.getItem('currentUser')).username && (
                        <>
                          {' | '}
                          <a
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{ cursor: 'pointer', fontSize: '10px', textDecoration: 'underline' }}
                          >
                            delete
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Reply form */}
                  {replyTo === comment.id && (
                    <div style={{ marginLeft: `${indentWidth}px`, marginTop: '10px' }}>
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

              {/* Recursively render replies */}
              {comment.replies && comment.replies.length > 0 && (
                comment.replies.map(reply => renderComment(reply, depth + 1))
              )}
            </tbody>
          </table>
        </td>
      </tr>
    );
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

  // Generate page title and description for SEO
  const pageTitle = `${paper.title} | arXiv News`;
  const pageDescription = paper.summary
    ? paper.summary.substring(0, 155) + '...'
    : `Discuss ${paper.title} on arXiv News. Read the paper, upvote, and join the discussion.`;
  const pageUrl = `https://arxiv-news.com/paper/${arxivId}`;
  const keywords = `${paper.title}, arxiv, ${paper.category || 'research'}, paper discussion, ${arxivId}, comments, arXiv News`;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:site_name" content="arXiv News" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={pageUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />

        {/* Structured Data (JSON-LD) for Rich Snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            "headline": paper.title,
            "description": pageDescription,
            "url": pageUrl,
            "discussionUrl": pageUrl,
            "commentCount": comments.length,
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/CommentAction",
              "userInteractionCount": comments.length
            },
            "about": {
              "@type": "ScholarlyArticle",
              "name": paper.title,
              "url": paper.arxiv_url,
              "identifier": arxivId
            }
          })}
        </script>
      </Helmet>

      <tr>
        <td style={{ padding: '0px' }}>
          <table style={{ border: '0px', padding: '0px', borderCollapse: 'collapse', borderSpacing: '0px' }} className="itemlist">
            <tbody>
              {/* Paper Item */}
              <tr className="athing">
              <td style={{ verticalAlign: 'top' }} className="votelinks">
                <div style={{ textAlign: 'center', padding: '0 10px' }}>
                  <a
                    onClick={handleVotePaper}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={voted ? 'votearrow rotate180' : 'votearrow'} title={voted ? 'unvote' : 'upvote'} />
                  </a>
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
            {comments.map((comment) => renderComment(comment))}
          </tbody>
        </table>
      </td>
    </tr>
    </>
  );
}
