import type { Task } from '@/types';
import { PRIORITY_RANK } from './constants';

/** Today as YYYY-MM-DD in the browser's timezone (not UTC). */
export function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const isOverdue = (t: Pick<Task, 'due_date' | 'status'>) =>
  !!t.due_date && t.status !== 'done' && t.due_date < todayISO();

/** "Today", "Tomorrow", "Yesterday", or "12 Nov" (with year when not this year). */
export function formatDue(date: string | null): string {
  if (!date) return '';
  const today = todayISO();
  const diff = Math.round((Date.parse(date) - Date.parse(today)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = new Date(`${date}T00:00:00`);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/** Urgent first, then earliest due date, then newest. */
export function compareTasks(a: Task, b: Task): number {
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return b.created_at.localeCompare(a.created_at);
}

export const subtaskProgress = (t: Task) => {
  const subs = t.subtasks ?? [];
  return { done: subs.filter((s) => s.status === 'done').length, total: subs.length };
};

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Something went wrong.';
