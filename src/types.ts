export type Role = 'admin' | 'employee';
export type Status = 'todo' | 'in_progress' | 'review' | 'blocked' | 'done';
export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export interface User {
  id: string;
  username: string;
  full_name: string;
  job_title: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

/** Public directory entry: what every signed-in user may know about a colleague. */
export interface Person {
  id: string;
  full_name: string;
  job_title: string | null;
  is_active: boolean;
}

export interface SubtaskSummary {
  id: string;
  status: Status;
}

export interface Task {
  id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: SubtaskSummary[];
  comment_count?: number;
}

export type TaskDraft = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'parent_id'>>;

export interface Comment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface TeamProgress {
  id: string;
  full_name: string;
  job_title: string | null;
  is_active: boolean;
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  blocked: number;
  done: number;
  overdue: number;
  done_this_week: number;
}
