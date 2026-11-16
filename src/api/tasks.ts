import { db, unwrap } from '@/lib/supabase';
import type { Comment, Task, TaskDraft } from '@/types';

// Top-level tasks come with their subtasks' statuses and a comment count in a single request.
const TASK_FIELDS = '*, subtasks:tasks!parent_id(id,status), comments(count)';

type TaskRow = Omit<Task, 'comment_count'> & { comments?: { count: number }[] };
const toTask = ({ comments, ...t }: TaskRow): Task => ({ ...t, comment_count: comments?.[0]?.count ?? 0 });

export type TaskScope = { kind: 'mine'; userId: string } | { kind: 'all' };

export const tasksApi = {
  async list(scope: TaskScope): Promise<Task[]> {
    let q = db.from('tasks').select(TASK_FIELDS).is('parent_id', null).order('created_at', { ascending: false });
    if (scope.kind === 'mine') q = q.or(`assignee_id.eq.${scope.userId},created_by.eq.${scope.userId}`);
    return (await unwrap<TaskRow[]>(q)).map(toTask);
  },

  async create(draft: TaskDraft): Promise<Task> {
    const row = await unwrap<TaskRow>(db.from('tasks').insert(draft).select(TASK_FIELDS).single());
    return toTask(row);
  },

  async update(id: string, patch: TaskDraft): Promise<Task> {
    const row = await unwrap<TaskRow>(db.from('tasks').update(patch).eq('id', id).select(TASK_FIELDS).single());
    return toTask(row);
  },

  remove: (id: string) => unwrap<null>(db.from('tasks').delete().eq('id', id)),

  subtasks: (parentId: string) =>
    unwrap<Task[]>(db.from('tasks').select('*').eq('parent_id', parentId).order('created_at')),

  comments: (taskId: string) =>
    unwrap<Comment[]>(db.from('comments').select('*').eq('task_id', taskId).order('created_at')),

  addComment: (taskId: string, body: string) =>
    unwrap<Comment>(db.from('comments').insert({ task_id: taskId, body }).select().single()),

  removeComment: (id: string) => unwrap<null>(db.from('comments').delete().eq('id', id)),
};
