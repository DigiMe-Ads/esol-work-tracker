import { useSearchParams } from 'react-router-dom';
import { TaskWorkspace } from '@/components/tasks/TaskWorkspace';
import type { TaskScope } from '@/api/tasks';

const ALL: TaskScope = { kind: 'all' };

/** Admin: every task in the organisation. `?assignee=<id>` opens it filtered to one person. */
export default function AllTasksPage() {
  const [params] = useSearchParams();
  const assignee = params.get('assignee') ?? 'all';
  return (
    <>
      <header className="page-head">
        <div>
          <h1>All <span className="accent">tasks</span></h1>
          <p>Everything the team is working on. Filter by person, status or priority.</p>
        </div>
      </header>
      {/* keyed so following a link from Team Overview re-applies the filter */}
      <TaskWorkspace key={assignee} scope={ALL} showAssignee initialFilters={{ assignee }} />
    </>
  );
}
