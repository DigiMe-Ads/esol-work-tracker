import { useCallback, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import type { TaskScope } from '@/api/tasks';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useTaskFilters, type TaskFilters } from '@/hooks/useTaskFilters';
import { EmptyState, Loading } from '@/components/ui/States';
import type { Status } from '@/types';
import { TaskToolbar, type View } from './TaskToolbar';
import { TaskListView } from './TaskListView';
import { TaskBoardView } from './TaskBoardView';
import { TaskPanel } from './TaskPanel';
import { TaskFormModal } from './TaskFormModal';

const VIEW_KEY = 'esol-work-tracker.view';

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list';
  } catch {
    return 'list';
  }
}

interface Props {
  scope: TaskScope;
  /** Show the assignee filter (admin "All tasks"). */
  showAssignee?: boolean;
  initialFilters?: Partial<TaskFilters>;
}

/** Toolbar + list/board + detail panel + new-task form, for any set of tasks. */
export function TaskWorkspace({ scope, showAssignee = false, initialFilters }: Props) {
  const { user, isAdmin } = useAuth();
  const { tasks, loading, create, update, remove, patchLocal } = useTasks(scope);
  const { filters, set, reset, active, visible } = useTaskFilters(tasks, initialFilters);
  const [view, setView] = useState<View>(readView);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  };

  const onStatus = useCallback((id: string, status: Status) => void update(id, { status }).catch(() => undefined), [update]);

  // Quick-add in the "All tasks" view with an assignee filter assigns to that person.
  const filterAssignee = filters.assignee !== 'all' && filters.assignee !== 'none' ? filters.assignee : undefined;
  const quickAssignee = isAdmin && scope.kind === 'all' ? filterAssignee ?? null : user?.id ?? null;

  const onQuickAdd = useCallback(
    async (title: string, status: Status) => {
      await create({ title, status, assignee_id: quickAssignee }).catch(() => undefined);
    },
    [create, quickAssignee],
  );

  const openTask = tasks.find((t) => t.id === openId) ?? null;

  return (
    <>
      <TaskToolbar
        filters={filters}
        set={set}
        reset={reset}
        active={active}
        view={view}
        onView={changeView}
        onNew={() => setCreating(true)}
        showAssignee={showAssignee}
      />
      {loading ? (
        <Loading label="Loading tasks…" />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tasks yet">
          Create your first task with <strong>New task</strong>.
        </EmptyState>
      ) : view === 'list' ? (
        <TaskListView tasks={visible} onOpen={setOpenId} onStatus={onStatus} onQuickAdd={onQuickAdd} />
      ) : (
        <TaskBoardView tasks={visible} onOpen={setOpenId} onStatus={onStatus} />
      )}
      {!loading && tasks.length > 0 && visible.length === 0 && active && (
        <p className="small faint" style={{ textAlign: 'center', marginTop: 12 }}>No tasks match these filters.</p>
      )}
      <TaskPanel task={openTask} onClose={() => setOpenId(null)} onUpdate={update} onRemove={remove} patchLocal={patchLocal} />
      <TaskFormModal open={creating} onClose={() => setCreating(false)} onCreate={create} defaultAssignee={isAdmin ? filterAssignee : undefined} />
    </>
  );
}
