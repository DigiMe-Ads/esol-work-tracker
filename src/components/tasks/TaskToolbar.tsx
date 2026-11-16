import { KanbanSquare, List, Plus, Search, X } from 'lucide-react';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import { usePeople } from '@/context/PeopleContext';
import type { TaskFilters } from '@/hooks/useTaskFilters';

export type View = 'list' | 'board';

interface Props {
  filters: TaskFilters;
  set: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  reset: () => void;
  active: boolean;
  view: View;
  onView: (v: View) => void;
  onNew: () => void;
  showAssignee: boolean;
}

export function TaskToolbar({ filters, set, reset, active, view, onView, onNew, showAssignee }: Props) {
  const { people } = usePeople();
  return (
    <div className="toolbar glass">
      <label className="search">
        <Search size={16} />
        <input className="input input--sm" placeholder="Search tasks" value={filters.search} onChange={(e) => set('search', e.target.value)} aria-label="Search tasks" />
      </label>
      <select className="select select--sm" style={{ width: 'auto' }} value={filters.status} onChange={(e) => set('status', e.target.value as TaskFilters['status'])} aria-label="Filter by status">
        <option value="all">All statuses</option>
        <option value="open">Not done</option>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select className="select select--sm" style={{ width: 'auto' }} value={filters.priority} onChange={(e) => set('priority', e.target.value as TaskFilters['priority'])} aria-label="Filter by priority">
        <option value="all">All priorities</option>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      {showAssignee && (
        <select className="select select--sm" style={{ width: 'auto' }} value={filters.assignee} onChange={(e) => set('assignee', e.target.value)} aria-label="Filter by assignee">
          <option value="all">Everyone</option>
          <option value="none">Unassigned</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      )}
      <label className="check-label">
        <input type="checkbox" checked={filters.overdueOnly} onChange={(e) => set('overdueOnly', e.target.checked)} /> Overdue
      </label>
      {active && (
        <button className="btn btn--ghost btn--sm" onClick={reset}>
          <X size={14} /> Clear
        </button>
      )}
      <span className="spacer" />
      <div className="seg" role="tablist" aria-label="View">
        <button className={view === 'list' ? 'on' : ''} onClick={() => onView('list')} role="tab" aria-selected={view === 'list'}>
          <List size={15} /> List
        </button>
        <button className={view === 'board' ? 'on' : ''} onClick={() => onView('board')} role="tab" aria-selected={view === 'board'}>
          <KanbanSquare size={15} /> Board
        </button>
      </div>
      <button className="btn btn--primary btn--sm" onClick={onNew}>
        <Plus size={16} /> New task
      </button>
    </div>
  );
}
