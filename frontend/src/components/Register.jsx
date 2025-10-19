import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password);
      // Force Navbar to re-render by dispatching a custom event
      window.dispatchEvent(new Event('userLoggedIn'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr>
      <td style={{ padding: '20px' }}>
        <h1>Register</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
          {error && (
            <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9]+"
              title="3-20 alphanumeric characters"
              style={{ width: '100%', padding: '5px', fontSize: '10pt' }}
            />
            <small style={{ color: '#828282' }}>3-20 alphanumeric characters</small>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '5px', fontSize: '10pt' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', padding: '5px', fontSize: '10pt' }}
            />
            <small style={{ color: '#828282' }}>Minimum 6 characters</small>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p style={{ marginTop: '15px' }}>
            Already have an account?{' '}
            <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Login here</a>
          </p>
        </form>
      </td>
    </tr>
  );
}
