import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/format';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await signIn(username, password);
      // admin-only pages are only a valid return target for admins
      const adminPage = ['/team', '/all', '/employees'].includes(from);
      navigate(adminPage && u.role !== 'admin' ? '/' : from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="login glass stack" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark"><CheckSquare size={20} /></div>
          <div>
            <div className="brand-name">ESOL Campus Work Tracker</div>
            <div className="brand-sub">Sign in to see your tasks</div>
          </div>
        </div>
        <label className="field">
          <span>Username</span>
          <input className="input" autoComplete="username" autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn btn--primary" disabled={busy}>
          <LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="small faint">Accounts are created by your admin.</p>
      </form>
    </div>
  );
}
