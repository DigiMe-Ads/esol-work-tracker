import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { User } from '@/types';

interface Props {
  target: User | null;
  onClose: () => void;
  onSave: (user: User, password: string) => Promise<boolean>;
}

/** Admin sets a new password for someone who forgot theirs. */
export function PasswordResetModal({ target, onClose, onSave }: Props) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setPassword(''), [target]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    if (await onSave(target, password)) onClose();
    setBusy(false);
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Reset password"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="reset-form" className="btn btn--primary" disabled={busy || password.length < 8}>
            {busy ? 'Saving…' : 'Set password'}
          </button>
        </>
      }
    >
      <form id="reset-form" className="stack" onSubmit={submit}>
        <p className="small muted">
          Set a new password for <strong>{target?.full_name}</strong>. They are signed out everywhere and use this password next time.
        </p>
        <label className="field">
          <span>New password (8+ characters)</span>
          <input className="input" required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
