-- ESOL Campus Work Tracker: tables. Everything lives in the work_tracker schema of the ESOL HR Suite
-- Supabase project and touches nothing else (public = HR Suite, epc_feedback, student_portal stay as they are).
BEGIN;

CREATE SCHEMA work_tracker;

CREATE TABLE work_tracker.users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9._-]{3,32}$'),
  full_name     text NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 80),
  job_title     text CHECK (job_title IS NULL OR length(job_title) <= 80),
  role          text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  password_hash text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE work_tracker.sessions (
  token_hash bytea PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES work_tracker.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '14 days'
);
CREATE INDEX sessions_user_idx ON work_tracker.sessions (user_id);

-- Tasks and subtasks share one table: a subtask has parent_id set (one level deep).
CREATE TABLE work_tracker.tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid REFERENCES work_tracker.tasks(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description  text CHECK (description IS NULL OR length(description) <= 5000),
  status       text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'done')),
  priority     text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  due_date     date,
  assignee_id  uuid REFERENCES work_tracker.users(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES work_tracker.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_parent_idx ON work_tracker.tasks (parent_id);
CREATE INDEX tasks_assignee_idx ON work_tracker.tasks (assignee_id, status);
CREATE INDEX tasks_created_by_idx ON work_tracker.tasks (created_by);

CREATE TABLE work_tracker.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES work_tracker.tasks(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES work_tracker.users(id) ON DELETE SET NULL,
  body       text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_task_idx ON work_tracker.comments (task_id, created_at);

COMMIT;
