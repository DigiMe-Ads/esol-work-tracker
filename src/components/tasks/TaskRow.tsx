import { memo } from 'react';
import { CalendarDays, ListChecks, MessageSquare } from 'lucide-react';
import { Avatar, PriorityFlag, StatusSelect } from '@/components/ui/Badges';
import { formatDue, isOverdue, subtaskProgress } from '@/lib/format';
import type { Status, Task } from '@/types';

export interface TaskItemProps {
  task: Task;
  assigneeName: string | null;
  onOpen: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}

/** Small meta line: subtask progress, comment count, due date. Shared by rows and cards. */
export function TaskMeta({ task }: { task: Task }) {
  const subs = subtaskProgress(task);
  const late = isOverdue(task);
  return (
    <div className="task-meta">
      {subs.total > 0 && (
        <span title="Subtasks done">
          <ListChecks size={13} /> {subs.done}/{subs.total}
        </span>
      )}
      {!!task.comment_count && (
        <span title="Comments">
          <MessageSquare size={13} /> {task.comment_count}
        </span>
      )}
      {task.due_date && (
        <span className={late ? 'due--late' : undefined} title={late ? 'Overdue' : 'Due date'}>
          <CalendarDays size={13} /> {formatDue(task.due_date)}
        </span>
      )}
    </div>
  );
}

export const TaskRow = memo(function TaskRow({ task, assigneeName, onOpen, onStatus }: TaskItemProps) {
  return (
    <div className="task-row" onClick={() => onOpen(task.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(task.id)}>
      <div className="task-title">
        <div style={{ minWidth: 0 }}>
          <strong>{task.title}</strong>
          <TaskMeta task={task} />
        </div>
      </div>
      <StatusSelect value={task.status} onChange={(s) => onStatus(task.id, s)} />
      <div className="assignee hide-sm">
        <Avatar name={assigneeName} />
        <span>{assigneeName ?? 'Unassigned'}</span>
      </div>
      <span className={`small hide-sm ${isOverdue(task) ? 'due--late' : 'muted'}`}>{formatDue(task.due_date) || '—'}</span>
      <span className="hide-sm">
        <PriorityFlag priority={task.priority} />
      </span>
    </div>
  );
});
