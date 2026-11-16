import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '@/api/tasks';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/format';
import type { Comment, Status, Task, TaskDraft } from '@/types';

/** Subtasks and comments of one task, loaded when its panel opens. */
export function useTaskDetail(taskId: string | null, onSubtasksChanged: (subs: Task[]) => void) {
  const toast = useToast();
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([tasksApi.subtasks(taskId), tasksApi.comments(taskId)])
      .then(([subs, coms]) => {
        if (cancelled) return;
        setSubtasks(subs);
        setComments(coms);
        setLoadedId(taskId);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [taskId, toast]);

  const changeSubs = useCallback(
    (next: Task[]) => {
      setSubtasks(next);
      onSubtasksChanged(next);
    },
    [onSubtasksChanged],
  );

  const addSubtask = async (title: string) => {
    if (!taskId) return;
    try {
      const sub = await tasksApi.create({ title, parent_id: taskId });
      changeSubs([...subtasks, sub]);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const updateSubtask = async (id: string, patch: TaskDraft) => {
    const before = subtasks;
    changeSubs(subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    try {
      const saved = await tasksApi.update(id, patch);
      changeSubs(before.map((s) => (s.id === id ? { ...s, ...saved } : s)));
    } catch (err) {
      changeSubs(before);
      toast.error(errorMessage(err));
    }
  };

  const toggleSubtask = (id: string, status: Status) => updateSubtask(id, { status: status === 'done' ? 'todo' : 'done' });

  const removeSubtask = async (id: string) => {
    const before = subtasks;
    changeSubs(subtasks.filter((s) => s.id !== id));
    try {
      await tasksApi.remove(id);
    } catch (err) {
      changeSubs(before);
      toast.error(errorMessage(err));
    }
  };

  const addComment = async (body: string) => {
    if (!taskId) return false;
    try {
      const c = await tasksApi.addComment(taskId, body);
      setComments((all) => [...all, c]);
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    }
  };

  const removeComment = async (id: string) => {
    try {
      await tasksApi.removeComment(id);
      setComments((all) => all.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // true only once the data on screen belongs to taskId (not the previously opened task)
  const ready = loadedId === taskId && !loading;
  return { subtasks, comments, loading: !ready, ready, addSubtask, updateSubtask, toggleSubtask, removeSubtask, addComment, removeComment };
}
