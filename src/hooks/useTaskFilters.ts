import { useDeferredValue, useMemo, useState } from 'react';
import { compareTasks, isOverdue } from '@/lib/format';
import type { Priority, Status, Task } from '@/types';

export interface TaskFilters {
  search: string;
  status: Status | 'all' | 'open';
  priority: Priority | 'all';
  assignee: string | 'all';
  overdueOnly: boolean;
}

export const DEFAULT_FILTERS: TaskFilters = { search: '', status: 'all', priority: 'all', assignee: 'all', overdueOnly: false };

/** Filter + sort state for a task list. Search is deferred so typing never stutters on long lists. */
export function useTaskFilters(tasks: Task[], initial: Partial<TaskFilters> = {}) {
  const [filters, setFilters] = useState<TaskFilters>({ ...DEFAULT_FILTERS, ...initial });
  const search = useDeferredValue(filters.search.trim().toLowerCase());

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (filters.status === 'open' ? t.status === 'done' : filters.status !== 'all' && t.status !== filters.status) return false;
          if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
          if (filters.assignee !== 'all' && (t.assignee_id ?? 'none') !== filters.assignee) return false;
          if (filters.overdueOnly && !isOverdue(t)) return false;
          return !search || t.title.toLowerCase().includes(search) || (t.description ?? '').toLowerCase().includes(search);
        })
        .sort(compareTasks),
    [tasks, filters.status, filters.priority, filters.assignee, filters.overdueOnly, search],
  );

  const set = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const reset = () => setFilters(DEFAULT_FILTERS);
  const active = JSON.stringify({ ...filters, search: '' }) !== JSON.stringify({ ...DEFAULT_FILTERS }) || !!filters.search;

  return { filters, set, reset, active, visible };
}
