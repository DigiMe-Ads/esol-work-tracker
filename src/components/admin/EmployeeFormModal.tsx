import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { UserInput } from '@/api/users';
import type { Role, User } from '@/types';

export interface EmployeeForm extends UserInput {
  username: string;
  password: string;
  is_active: boolean;
}

interface Props {
  /** null = closed, 'new' = create, a user = edit */
  target: User | 'new' | null;
  onClose: () => void;
  onSave: (form: EmployeeForm) => Promise<boolean>;
}

const blank: EmployeeForm = { username: '', password: '', full_name: '', job_title: '', role: 'employee', is_active: true };

/** Create an employee together with their login, or edit their profile. */
export function EmployeeFormModal({ target, onClose, onSave }: Props) {
  const isNew = target === 'new';
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target === 'new') setForm(blank);
    else if (target)
      setForm({ ...blank, username: target.username, full_name: target.full_name, job_title: target.job_title ?? '', role: target.role, is_active: target.is_active });
  }, [target]);

  const set = <K extends keyof EmployeeForm>(k: K, v: EmployeeForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (await onSave(form)) onClose();
    setBusy(false);
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={isNew ? 'Add employee' : 'Edit employee'}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="employee-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Create login' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="employee-form" className="stack" onSubmit={submit}>
        <div className="grid-2">
          <label className="field">
            <span>Full name</span>
            <input className="input" required autoFocus maxLength={120} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </label>
          <label className="field">
            <span>Job title</span>
            <input className="input" maxLength={120} placeholder="e.g. Admissions Officer" value={form.job_title} onChange={(e) => set('job_title', e.target.value)} />
          </label>
          <label className="field">
            <span>Username</span>
            <input
              className="input"
              required
              disabled={!isNew}
              pattern="[a-z0-9._\-]{3,32}"
              title="3-32 characters: letters, numbers, dot, dash or underscore"
              autoComplete="off"
              value={form.username}
              onChange={(e) => set('username', e.target.value.toLowerCase().trim())}
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select className="select" value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        {isNew ? (
          <label className="field">
            <span>Password (8+ characters, share it with the employee)</span>
            <input className="input" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          </label>
        ) : (
          <label className="check-label">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            Active (inactive employees cannot sign in)
          </label>
        )}
      </form>
    </Modal>
  );
}
