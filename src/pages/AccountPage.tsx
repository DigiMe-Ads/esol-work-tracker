import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/ui/Badges';
import { errorMessage } from '@/lib/format';

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const mismatch = !!form.confirm && form.next !== form.confirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8) return toast.error('The new password must be at least 8 characters.');
    if (mismatch) return;
    setBusy(true);
    try {
      await authApi.changePassword(form.current, form.next);
      toast.success('Password changed.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, auto: string) => (
    <label className="field">
      <span>{label}</span>
      <input className="input" type="password" autoComplete={auto} required value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </label>
  );

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Your <span className="accent">account</span></h1>
          <p>Profile details and password.</p>
        </div>
      </header>
      <div className="stack" style={{ maxWidth: 480 }}>
        <section className="card glass row" style={{ gap: 14 }}>
          <Avatar name={user!.full_name} size="lg" />
          <div>
            <div className="strong">{user!.full_name}</div>
            <div className="small muted">
              {user!.job_title || 'No job title'} · @{user!.username} · {user!.role === 'admin' ? 'Admin' : 'Employee'}
            </div>
          </div>
        </section>
        <form className="card glass stack" onSubmit={submit}>
          <h3 className="row"><KeyRound size={18} /> Change password</h3>
          {field('current', 'Current password', 'current-password')}
          {field('next', 'New password (8+ characters)', 'new-password')}
          {field('confirm', 'Confirm new password', 'new-password')}
          {mismatch && <span className="small" style={{ color: 'var(--danger)' }}>The passwords don't match.</span>}
          <div>
            <button className="btn btn--primary" disabled={busy || mismatch}>{busy ? 'Saving…' : 'Change password'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
