import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // After login, go back to the page they originally wanted (e.g. a direct link)
  const goTo = location.state?.from?.pathname || '/inquiries';

  if (user) return <Navigate to={goTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "Invalid email or password"
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <div>
          <h1>Inquiry Desk</h1>
          <p className="muted">Sign in to manage customer inquiries.</p>
        </div>

        {error && <p className="alert alert-error" role="alert">{error}</p>}

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}