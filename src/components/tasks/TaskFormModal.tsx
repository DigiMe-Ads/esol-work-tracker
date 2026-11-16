import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { usePeople } from '@/context/PeopleContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/format';
import type { Priority, Status, TaskDraft } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: TaskDraft) => Promise<unknown>;
  /** Pre-selected assignee (admin creating work for someone). */
  defaultAssignee?: string;
}

const blank = { title: '', description: '', status: 'todo' as Status, priority: 'normal' as Priority, due_date: '', assignee_id: '' };

/** New task. Employees always create for themselves; admins choose who it is for. */
export function TaskFormModal({ open, onClose, onCreate, defaultAssignee }: Props) {
  const { user, isAdmin } = useAuth();
  const { people } = usePeople();
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...blank, assignee_id: defaultAssignee ?? user?.id ?? '' });
  }, [open, defaultAssignee, user?.id]);

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        assignee_id: isAdmin ? form.assignee_id || null : user?.id ?? null,
      });
      toast.success('Task created.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="task-form" className="btn btn--primary" disabled={busy || !form.title.trim()}>
            {busy ? 'Creating…' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" className="stack" onSubmit={submit}>
        <label className="field">
          <span>Title</span>
          <input className="input" autoFocus required maxLength={200} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to be done?" />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea className="textarea" maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Details, links, acceptance notes (optional)" />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Status</span>
            <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select className="select" value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input className="input" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </label>
          {isAdmin && (
            <label className="field">
              <span>Assign to</span>
              <select className="select" value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)}>
                <option value="">Unassigned</option>
                {people.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </label>
          )}
        </div>
      </form>
    </Modal>
  );
}
