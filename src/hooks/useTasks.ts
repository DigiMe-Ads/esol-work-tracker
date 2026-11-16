import { useCallback, useEffect, useRef, useState } from 'react';
import { tasksApi, type TaskScope } from '@/api/tasks';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/format';
import type { Task, TaskDraft } from '@/types';

/**
 * Top-level tasks for a scope, with optimistic updates: the UI changes immediately and rolls back
 * (with a toast) if the server refuses.
 */
export function useTasks(scope: TaskScope) {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const scopeKey = scope.kind === 'mine' ? `mine:${scope.userId}` : 'all';

  const reload = useCallback(async () => {
    try {
      setTasks(await tasksApi.list(scope));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
    // scopeKey captures everything `scope` can change, so a new object each render doesn't refetch.
  }, [scopeKey, toast]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  // Refresh when the tab regains focus, so work done elsewhere shows up without a manual reload.
  useEffect(() => {
    const onFocus = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [reload]);

  const create = useCallback(
    async (draft: TaskDraft) => {
      const task = await tasksApi.create(draft);
      setTasks((all) => [task, ...all]);
      return task;
    },
    [],
  );

  const update = useCallback(
    async (id: string, patch: TaskDraft) => {
      const before = tasksRef.current.find((t) => t.id === id);
      setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      try {
        const saved = await tasksApi.update(id, patch);
        setTasks((all) => all.map((t) => (t.id === id ? saved : t)));
        return saved;
      } catch (err) {
        if (before) setTasks((all) => all.map((t) => (t.id === id ? before : t)));
        toast.error(errorMessage(err));
        throw err;
      }
    },
    [toast],
  );

  const remove = useCallback(
    async (id: string) => {
      const before = tasksRef.current;
      setTasks((all) => all.filter((t) => t.id !== id));
      try {
        await tasksApi.remove(id);
      } catch (err) {
        setTasks(before);
        toast.error(errorMessage(err));
        throw err;
      }
    },
    [toast],
  );

  /** Local-only patch, e.g. subtask progress changed inside the task panel. */
  const patchLocal = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return { tasks, loading, reload, create, update, remove, patchLocal };
}
