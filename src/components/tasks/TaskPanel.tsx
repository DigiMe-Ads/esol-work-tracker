import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SidePanel } from '@/components/ui/Modal';
import { Avatar, PrioritySelect, StatusSelect } from '@/components/ui/Badges';
import { Loading } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePeople } from '@/context/PeopleContext';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { timeAgo } from '@/lib/format';
import type { Task, TaskDraft } from '@/types';
import { SubtaskList } from './SubtaskList';
import { CommentThread } from './CommentThread';

interface Props {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, patch: TaskDraft) => Promise<unknown>;
  onRemove: (id: string) => Promise<void>;
  patchLocal: (id: string, patch: Partial<Task>) => void;
}

/** Everything about one task: properties, description, subtasks and comments. */
export function TaskPanel({ task, onClose, onUpdate, onRemove, patchLocal }: Props) {
  const { user, isAdmin } = useAuth();
  const { people, nameOf } = usePeople();
  const id = task?.id ?? null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    // Only reset the editors when a different task opens, not after every save.
  }, [id]);

  const onSubs = useCallback(
    (subs: Task[]) => id && patchLocal(id, { subtasks: subs.map((s) => ({ id: s.id, status: s.status })) }),
    [id, patchLocal],
  );
  const detail = useTaskDetail(id, onSubs);

  // Keep the comment badge on the list row in step with the thread.
  const commentCount = detail.comments.length;
  useEffect(() => {
    if (id && detail.ready) patchLocal(id, { comment_count: commentCount });
  }, [id, commentCount, detail.ready, patchLocal]);

  if (!task) return null;
  const save = (patch: TaskDraft) => onUpdate(task.id, patch).catch(() => undefined);
  const canDelete = isAdmin || task.created_by === user?.id;

  const saveTitle = () => {
    const t = title.trim();
    if (!t) setTitle(task.title);
    else if (t !== task.title) save({ title: t });
  };
  const saveDescription = () => {
    const d = description.trim() || null;
    if (d !== (task.description ?? null)) save({ description: d });
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${task.title}" and its subtasks? This cannot be undone.`)) return;
    try {
      await onRemove(task.id);
      onClose();
    } catch {
      /* hook already showed the error */
    }
  };

  return (
    <SidePanel
      open
      onClose={onClose}
      title={
        <>
          <span className="small faint">Created {timeAgo(task.created_at)} by {nameOf(task.created_by)}</span>
          <span className="spacer" />
          {canDelete && (
            <button className="icon-btn" onClick={remove} aria-label="Delete task" title="Delete task">
              <Trash2 size={17} />
            </button>
          )}
        </>
      }
    >
      <input
        className="title-input"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Task title"
      />
      <div className="props">
        <span>Status</span>
        <div><StatusSelect value={task.status} onChange={(status) => save({ status })} /></div>
        <span>Priority</span>
        <div style={{ maxWidth: 180 }}><PrioritySelect value={task.priority} onChange={(priority) => save({ priority })} /></div>
        <span>Due date</span>
        <input className="input input--sm" style={{ maxWidth: 180 }} type="date" value={task.due_date ?? ''} onChange={(e) => save({ due_date: e.target.value || null })} />
        <span>Assignee</span>
        {isAdmin ? (
          <select className="select select--sm" style={{ maxWidth: 240 }} value={task.assignee_id ?? ''} onChange={(e) => save({ assignee_id: e.target.value || null })}>
            <option value="">Unassigned</option>
            {people.map((p) => <option key={p.id} value={p.id} disabled={!p.is_active && p.id !== task.assignee_id}>{p.full_name}</option>)}
          </select>
        ) : (
          <div className="row"><Avatar name={task.assignee_id ? nameOf(task.assignee_id) : null} /> {nameOf(task.assignee_id)}</div>
        )}
      </div>
      <label className="field">
        <span>Description</span>
        <textarea
          className="textarea"
          placeholder="Add details…"
          value={description}
          maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
        />
      </label>
      {detail.loading ? (
        <Loading label="Loading subtasks…" />
      ) : (
        <>
          <SubtaskList
            subtasks={detail.subtasks}
            onAdd={detail.addSubtask}
            onToggle={detail.toggleSubtask}
            onStatus={(sid, status) => detail.updateSubtask(sid, { status })}
            onRemove={detail.removeSubtask}
          />
          <CommentThread comments={detail.comments} onAdd={detail.addComment} onRemove={detail.removeComment} />
        </>
      )}
    </SidePanel>
  );
}
