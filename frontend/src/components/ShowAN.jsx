import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, votePost } from '../api';

export default function ShowAN() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('hot');

  useEffect(() => {
    loadPosts();
  }, [sort]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts(sort);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
    setLoading(false);
  };

  const handleVotePost = async (postId) => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to vote');
      navigate('/login');
      return;
    }

    try {
      await votePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Failed to vote post:', error);
      if (error.response?.status === 401) {
        alert('Please login to vote');
        navigate('/login');
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

  const extractDomain = (url) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return null;
    }
  };

  if (loading) {
    return <tr><td>Loading...</td></tr>;
  }

  return (
    <>
      <tr style={{ height: '10px' }} />
      <tr>
        <td>
          <table style={{ border: '0px', padding: '0px', borderSpacing: '0px', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px' }}>
                  <span style={{ fontSize: '10pt', fontFamily: 'Verdana' }}>
                    <b>Show AN</b> |{' '}
                    <a onClick={() => setSort('hot')} style={{ cursor: 'pointer', fontWeight: sort === 'hot' ? 'bold' : 'normal' }}>
                      hot
                    </a> |{' '}
                    <a onClick={() => setSort('new')} style={{ cursor: 'pointer', fontWeight: sort === 'new' ? 'bold' : 'normal' }}>
                      new
                    </a> |{' '}
                    <Link to="/submit">submit</Link>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr style={{ height: '5px' }} />
      <tr>
        <td>
          <table style={{ border: '0px', borderCollapse: 'collapse', padding: '0px' }}>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ padding: '10px', textAlign: 'center', color: '#828282' }}>
                    No posts yet. Be the first to <Link to="/submit">submit something</Link>!
                  </td>
                </tr>
              ) : (
                posts.map((post, index) => (
                  <tr key={post.id} className="athing">
                    <td style={{ verticalAlign: 'top', textAlign: 'right', paddingRight: '4px' }}>
                      <span style={{ fontSize: '10pt', color: '#828282' }}>{index + 1}.</span>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <a
                        onClick={() => handleVotePost(post.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="votearrow" title="upvote" />
                      </a>
                    </td>
                    <td className="title" style={{ paddingLeft: '5px' }}>
                      <span className="titleline">
                        {post.url ? (
                          <>
                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="storylink">
                              {post.title}
                            </a>
                            <span className="sitebit comhead">
                              {' '}(<a href={post.url} target="_blank" rel="noopener noreferrer">
                                <span className="sitestr">{extractDomain(post.url)}</span>
                              </a>)
                            </span>
                          </>
                        ) : (
                          <Link to={`/post/${post.id}`} className="storylink">
                            {post.title}
                          </Link>
                        )}
                      </span>
                      <br />
                      <span className="subtext" style={{ fontSize: '7pt', color: '#828282' }}>
                        {post.vote_count} points by{' '}
                        <Link to={`/user/${post.username}`}>{post.username}</Link>{' '}
                        {formatTimeAgo(post.created_at)} |{' '}
                        <Link to={`/post/${post.id}`}>discuss</Link>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </td>
      </tr>
      <tr style={{ height: '10px' }} />
    </>
  );
}
