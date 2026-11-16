# ESOL Campus Work Tracker

A simple task tracker for ESOL Premier Campus staff. Employees add tasks, break them into subtasks,
update status and comment. Admins create employee logins, assign work and watch team progress.
It does not depend on the Student Portal or HR Suite apps.

## Stack

- React 18 + Vite + TypeScript, React Router (each page is its own lazy-loaded chunk)
- Supabase Postgres, schema `work_tracker` in the ESOL HR Suite project (`qwsdnflnaehnycqqhmkf`)
- Its own login system (bcrypt passwords + session tokens), not Supabase Auth
- Poppins only, no italics, glass panels over a soft gradient

## Run locally

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5178
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run check:lines` (fails if any file is over 200 lines).

## Deploy (Vercel)

Import the folder as a Vite project and add the two `VITE_SUPABASE_*` environment variables.
`vercel.json` proxies `/supabase/*` to Supabase so networks that block `supabase.co` still work.

## Database

Migrations live in `supabase/`, applied in order (00001 to 00006):

| File | What it does |
| --- | --- |
| 00001_tables | users, sessions, tasks (with `parent_id` for subtasks), comments |
| 00002_auth | `sign_in` (locks after 8 failures), `sign_out`, `me`, `change_password` |
| 00003_access | who can see/edit which task (row level security) and integrity triggers |
| 00004_admin | create/edit/delete users, reset passwords, `team_progress` |
| 00005_expose_schema | lets the API serve the `work_tracker` schema |
| 00006_fix_insert_policy | subtask insert rule without policy recursion |

### Access rules

- **Employees** see tasks assigned to them or created by them, plus the subtasks of those tasks.
  They can create tasks for themselves and can't hand a task to someone else.
- **Admins** see and edit everything, assign tasks to anyone and manage logins.
- Only an admin or the task's creator can delete a task. Subtasks can't have their own subtasks.

## Code layout

```
src/
  api/          one module per backend area (auth, tasks, users)
  context/      Auth, People (name directory), Toast
  hooks/        useTasks (optimistic updates), useTaskFilters, useTaskDetail, useEmployees
  components/
    ui/         Modal, SidePanel, badges, empty/loading states
    tasks/      list view, board view (drag & drop), panel, subtasks, comments, toolbar
    admin/      stat tiles, progress cards, employee and password modals
  pages/        Login, My Tasks, Team Overview, All Tasks, Employees, Account
  styles/       tokens, base, controls, layout, tasks, admin
```
