import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Force Navbar to re-render by dispatching a custom event
      window.dispatchEvent(new Event('userLoggedIn'));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr>
      <td style={{ padding: '20px' }}>
        <h1>Login</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
          {error && (
            <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
          )}

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
              style={{ width: '100%', padding: '5px', fontSize: '10pt' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={{ marginTop: '15px' }}>
            Don't have an account?{' '}
            <a onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>Register here</a>
          </p>
        </form>
      </td>
    </tr>
  );
}
