import { memo, useState, type CSSProperties, type DragEvent } from 'react';
import { STATUSES } from '@/lib/constants';
import { usePeople } from '@/context/PeopleContext';
import { Avatar, PriorityFlag, StatusSelect } from '@/components/ui/Badges';
import type { Status, Task } from '@/types';
import { TaskMeta, type TaskItemProps } from './TaskRow';

const TaskCard = memo(function TaskCard({ task, assigneeName, onOpen, onStatus }: TaskItemProps) {
  const [dragging, setDragging] = useState(false);
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/task-id', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
  };
  return (
    <article
      className={`task-card${dragging ? ' task-card--dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      onClick={() => onOpen(task.id)}
    >
      <div className="row">
        <PriorityFlag priority={task.priority} />
        <span className="spacer" />
        <Avatar name={assigneeName} />
      </div>
      <div className="title">{task.title}</div>
      <TaskMeta task={task} />
      {/* touch screens can't drag: change status here */}
      <StatusSelect value={task.status} onChange={(s) => onStatus(task.id, s)} />
    </article>
  );
});

/** Kanban columns by status. Drag a card to another column to change its status. */
export function TaskBoardView({ tasks, onOpen, onStatus }: { tasks: Task[]; onOpen: (id: string) => void; onStatus: (id: string, s: Status) => void }) {
  const { nameOf } = usePeople();
  const [over, setOver] = useState<Status | null>(null);

  const drop = (status: Status) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData('text/task-id');
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== status) onStatus(id, status);
  };

  return (
    <div className="board">
      {STATUSES.map((s) => {
        const column = tasks.filter((t) => t.status === s.value);
        return (
          <section
            key={s.value}
            className={`column glass${over === s.value ? ' column--over' : ''}`}
            style={{ '--pill': s.color } as CSSProperties}
            onDragOver={(e) => {
              e.preventDefault();
              if (over !== s.value) setOver(s.value);
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOver(null)}
            onDrop={drop(s.value)}
          >
            <div className="column-head">
              <span className="dot" /> {s.label} <span className="faint small">{column.length}</span>
            </div>
            {column.map((t) => (
              <TaskCard key={t.id} task={t} assigneeName={t.assignee_id ? nameOf(t.assignee_id) : null} onOpen={onOpen} onStatus={onStatus} />
            ))}
            {column.length === 0 && <p className="small faint" style={{ padding: '8px 4px' }}>Drop tasks here</p>}
          </section>
        );
      })}
    </div>
  );
}
