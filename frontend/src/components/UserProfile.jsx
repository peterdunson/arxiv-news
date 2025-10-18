import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, updateProfile } from '../api';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [error, setError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile(username);
      setProfile(data);
      setNewBio(data.bio || '');
    } catch (err) {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(newBio);
      setProfile({ ...profile, bio: newBio });
      setEditing(false);
      const user = JSON.parse(localStorage.getItem('currentUser'));
      user.bio = newBio;
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      alert('Failed to update bio');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <tr><td style={{ padding: '20px' }}>Loading...</td></tr>;
  }

  if (error) {
    return (
      <tr>
        <td style={{ padding: '20px' }}>
          <p>{error}</p>
          <p><a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Back to home</a></p>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ padding: '20px' }}>
        <h1>{profile.username} ({profile.karma})</h1>

        <table style={{ marginTop: '10px', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ paddingRight: '10px', verticalAlign: 'top' }}><b>user:</b></td>
              <td>{profile.username}</td>
            </tr>
            <tr>
              <td style={{ paddingRight: '10px', verticalAlign: 'top' }}><b>created:</b></td>
              <td>{formatDate(profile.created_at)}</td>
            </tr>
            <tr>
              <td style={{ paddingRight: '10px', verticalAlign: 'top' }}><b>karma:</b></td>
              <td>{profile.karma}</td>
            </tr>
            <tr>
              <td style={{ paddingRight: '10px', verticalAlign: 'top' }}><b>about:</b></td>
              <td>
                {!editing ? (
                  <>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {profile.bio || <i style={{ color: '#828282' }}>No bio yet</i>}
                    </div>
                    {isOwnProfile && (
                      <a
                        onClick={() => setEditing(true)}
                        style={{ cursor: 'pointer', fontSize: '9pt', marginTop: '5px', display: 'inline-block' }}
                      >
                        edit
                      </a>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleUpdateBio}>
                    <textarea
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      maxLength={160}
                      rows={4}
                      cols={50}
                      style={{ display: 'block', marginBottom: '5px' }}
                    />
                    <small style={{ color: '#828282' }}>
                      {newBio.length}/160 characters
                    </small>
                    <div style={{ marginTop: '10px' }}>
                      <button type="submit" style={{ marginRight: '10px', cursor: 'pointer' }}>
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setNewBio(profile.bio || '');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <p>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>← back</a>
        </p>
      </td>
    </tr>
  );
}
