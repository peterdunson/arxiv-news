import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api';

export default function SubmitPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert('Please login to submit');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!url.trim() && !text.trim()) {
      setError('Please provide either a URL or text');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const post = await createPost(
        title.trim(),
        url.trim() || null,
        text.trim() || null
      );
      navigate(`/post/${post.id}`);
    } catch (err) {
      console.error('Failed to create post:', err);
      if (err.response?.status === 401) {
        alert('Please login to submit');
        navigate('/login');
      } else {
        setError(err.response?.data?.detail || 'Failed to create post. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <tr>
      <td style={{ padding: '20px', fontFamily: 'Verdana, Geneva, sans-serif' }}>
        <form onSubmit={handleSubmit}>
          <table style={{ border: '0', fontFamily: 'Verdana, Geneva, sans-serif' }}>
            <tbody>
              <tr>
                <td style={{ paddingBottom: '10px', fontSize: '10pt' }}>
                  <b>Submit</b>
                </td>
              </tr>
              {error && (
                <tr>
                  <td style={{ paddingBottom: '10px', color: '#b31b1b' }}>
                    {error}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ paddingBottom: '5px', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '10pt' }}>
                  <b>title</b>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '15px' }}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    size={50}
                    style={{
                      padding: '4px',
                      fontSize: '10pt',
                      fontFamily: 'Verdana',
                      border: '1px solid #828282',
                      width: '100%',
                      maxWidth: '500px'
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '5px', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '10pt' }}>
                  <b>url</b>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '15px' }}>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    size={50}
                    placeholder="https://..."
                    style={{
                      padding: '4px',
                      fontSize: '10pt',
                      fontFamily: 'Verdana',
                      border: '1px solid #828282',
                      width: '100%',
                      maxWidth: '500px'
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '5px', fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '10pt' }}>
                  <b>or text</b>
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '15px' }}>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    cols={50}
                    style={{
                      padding: '4px',
                      fontSize: '10pt',
                      fontFamily: 'Verdana',
                      border: '1px solid #828282',
                      width: '100%',
                      maxWidth: '500px'
                    }}
                  />
                  <br />
                  <small style={{ color: '#828282' }}>
                    Leave url blank to submit a question for discussion. If there is no url, text will appear at the top of the thread.
                  </small>
                </td>
              </tr>
              <tr>
                <td>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '4px 12px',
                      fontSize: '10pt',
                      fontFamily: 'Verdana',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      backgroundColor: '#f6f6ef',
                      border: '1px solid #828282'
                    }}
                  >
                    {submitting ? 'submitting...' : 'submit'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </td>
    </tr>
  );
}
