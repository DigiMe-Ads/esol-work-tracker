import type { Priority, Status } from '@/types';

export interface Option<T extends string> {
  value: T;
  label: string;
  /** CSS colour token used for dots, pills and column accents */
  color: string;
}

/** Board/list order: work flows left to right, blocked sits next to the work it holds up. */
export const STATUSES: Option<Status>[] = [
  { value: 'todo', label: 'To Do', color: 'var(--status-todo)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--status-progress)' },
  { value: 'review', label: 'In Review', color: 'var(--status-review)' },
  { value: 'blocked', label: 'Blocked', color: 'var(--status-blocked)' },
  { value: 'done', label: 'Done', color: 'var(--status-done)' },
];

export const PRIORITIES: Option<Priority>[] = [
  { value: 'urgent', label: 'Urgent', color: 'var(--prio-urgent)' },
  { value: 'high', label: 'High', color: 'var(--prio-high)' },
  { value: 'normal', label: 'Normal', color: 'var(--prio-normal)' },
  { value: 'low', label: 'Low', color: 'var(--prio-low)' },
];

export const statusOf = (s: Status) => STATUSES.find((o) => o.value === s) ?? STATUSES[0];
export const priorityOf = (p: Priority) => PRIORITIES.find((o) => o.value === p) ?? PRIORITIES[2];

export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
