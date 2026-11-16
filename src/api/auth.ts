import { db, setSessionToken, unwrap } from '@/lib/supabase';
import type { User } from '@/types';

export const authApi = {
  async signIn(username: string, password: string): Promise<User> {
    const res = await unwrap<{ token?: string; user?: User; error?: string }>(
      db.rpc('sign_in', { p_username: username, p_password: password }),
    );
    if (res.error || !res.token || !res.user) throw new Error(res.error ?? 'Sign in failed.');
    setSessionToken(res.token);
    return res.user;
  },

  async signOut(): Promise<void> {
    await db.rpc('sign_out');
    setSessionToken(null);
  },

  /** The signed-in user, or null when the stored session has expired. */
  me: () => unwrap<User | null>(db.rpc('me')),

  changePassword: (oldPassword: string, newPassword: string) =>
    unwrap<void>(db.rpc('change_password', { p_old: oldPassword, p_new: newPassword })),
};
