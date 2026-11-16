import { useState, type CSSProperties, type FormEvent } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { STATUSES } from '@/lib/constants';
import { usePeople } from '@/context/PeopleContext';
import type { Status, Task } from '@/types';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onOpen: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
  onQuickAdd: (title: string, status: Status) => Promise<void>;
}

function QuickAdd({ status, onAdd }: { status: Status; onAdd: Props['onQuickAdd'] }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onAdd(title.trim(), status);
      setTitle('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="quick-add" onSubmit={submit}>
      <input className="input" placeholder="+ Add a task and press Enter" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} aria-label="New task title" />
      {title.trim() && <button className="btn btn--primary btn--sm" disabled={busy}><Plus size={15} /> Add</button>}
    </form>
  );
}

/** Tasks grouped by status, each group collapsible, with a quick-add line per group. */
export function TaskListView({ tasks, onOpen, onStatus, onQuickAdd }: Props) {
  const { nameOf } = usePeople();
  const [collapsed, setCollapsed] = useState<Set<Status>>(() => new Set(['done']));
  const toggle = (s: Status) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  return (
    <div>
      {STATUSES.map((s) => {
        const group = tasks.filter((t) => t.status === s.value);
        const open = !collapsed.has(s.value);
        return (
          <section key={s.value} className="group glass" style={{ '--pill': s.color } as CSSProperties}>
            <button className="group-head" onClick={() => toggle(s.value)} aria-expanded={open}>
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="dot" /> {s.label} <span className="count">{group.length}</span>
            </button>
            {open && (
              <>
                {group.map((t) => (
                  <TaskRow key={t.id} task={t} assigneeName={t.assignee_id ? nameOf(t.assignee_id) : null} onOpen={onOpen} onStatus={onStatus} />
                ))}
                <QuickAdd status={s.value} onAdd={onQuickAdd} />
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
