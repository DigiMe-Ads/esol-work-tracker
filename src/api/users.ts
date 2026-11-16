import { db, unwrap } from '@/lib/supabase';
import type { Person, Role, TeamProgress, User } from '@/types';

export interface UserInput {
  full_name: string;
  job_title: string;
  role: Role;
}

export const usersApi = {
  /** Names of everyone (any signed-in user). */
  people: () => unwrap<Person[]>(db.rpc('list_people')),

  // ---- admin only (the database refuses these for employees)
  list: () => unwrap<User[]>(db.rpc('list_users')),

  create: (input: UserInput & { username: string; password: string }) =>
    unwrap<User>(
      db.rpc('create_user', {
        p_username: input.username,
        p_full_name: input.full_name,
        p_job_title: input.job_title,
        p_role: input.role,
        p_password: input.password,
      }),
    ),

  update: (id: string, input: UserInput & { is_active: boolean }) =>
    unwrap<User>(
      db.rpc('update_user', {
        p_user: id,
        p_full_name: input.full_name,
        p_job_title: input.job_title,
        p_role: input.role,
        p_active: input.is_active,
      }),
    ),

  resetPassword: (id: string, password: string) =>
    unwrap<void>(db.rpc('reset_password', { p_user: id, p_password: password })),

  remove: (id: string) => unwrap<void>(db.rpc('delete_user', { p_user: id })),

  teamProgress: () => unwrap<TeamProgress[]>(db.rpc('team_progress')),
};
