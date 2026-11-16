import { useState, type FormEvent } from 'react';
import { Check, ListChecks, Plus, Trash2 } from 'lucide-react';
import { StatusSelect } from '@/components/ui/Badges';
import { useAuth } from '@/context/AuthContext';
import type { Status, Task } from '@/types';

interface Props {
  subtasks: Task[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (id: string, status: Status) => void;
  onStatus: (id: string, status: Status) => void;
  onRemove: (id: string) => void;
}

/** Checklist of subtasks inside the task panel. */
export function SubtaskList({ subtasks, onAdd, onToggle, onStatus, onRemove }: Props) {
  const { user, isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const done = subtasks.filter((s) => s.status === 'done').length;
  const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await onAdd(title.trim());
    setTitle('');
    setBusy(false);
  };

  return (
    <section>
      <div className="section-title">
        <ListChecks size={17} /> Subtasks <span className="count">{done}/{subtasks.length}</span>
      </div>
      {subtasks.length > 0 && (
        <div className="progress" style={{ marginBottom: 8 }} aria-label={`${pct}% complete`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
      {subtasks.map((s) => (
        <div key={s.id} className={`subtask${s.status === 'done' ? ' subtask--done' : ''}`}>
          <button
            className={`checkbox${s.status === 'done' ? ' checkbox--on' : ''}`}
            onClick={() => onToggle(s.id, s.status)}
            aria-label={s.status === 'done' ? 'Mark not done' : 'Mark done'}
          >
            {s.status === 'done' && <Check size={13} strokeWidth={3} />}
          </button>
          <span className="name">{s.title}</span>
          <StatusSelect value={s.status} onChange={(st) => onStatus(s.id, st)} />
          {(isAdmin || s.created_by === user?.id) && (
            <button className="icon-btn" onClick={() => onRemove(s.id)} aria-label="Delete subtask">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      <form className="row" style={{ marginTop: 8 }} onSubmit={submit}>
        <input className="input input--sm" placeholder="Add a subtask" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} maxLength={200} />
        <button className="btn btn--ghost btn--sm" disabled={busy || !title.trim()}>
          <Plus size={15} /> Add
        </button>
      </form>
    </section>
  );
}
