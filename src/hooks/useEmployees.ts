import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '@/api/users';
import { useToast } from '@/context/ToastContext';
import { usePeople } from '@/context/PeopleContext';
import { errorMessage } from '@/lib/format';
import type { EmployeeForm } from '@/components/admin/EmployeeFormModal';
import type { User } from '@/types';

/** Admin user management. Every change also refreshes the shared people directory. */
export function useEmployees() {
  const toast = useToast();
  const { refresh: refreshPeople } = usePeople();
  const [users, setUsers] = useState<User[] | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      toast.error(errorMessage(err));
      setUsers((u) => u ?? []);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  /** Runs an action, toasts the outcome, reloads. Returns whether it worked (modals close on true). */
  const run = useCallback(
    async (action: () => Promise<unknown>, success: string) => {
      try {
        await action();
        toast.success(success);
        await Promise.all([load(), refreshPeople()]);
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [load, refreshPeople, toast],
  );

  const save = (target: User | 'new', f: EmployeeForm) => {
    const input = { full_name: f.full_name.trim(), job_title: f.job_title.trim(), role: f.role };
    return target === 'new'
      ? run(() => usersApi.create({ ...input, username: f.username, password: f.password }), `Login created for ${input.full_name}.`)
      : run(() => usersApi.update(target.id, { ...input, is_active: f.is_active }), 'Employee updated.');
  };

  const setActive = (u: User, is_active: boolean) =>
    run(
      () => usersApi.update(u.id, { full_name: u.full_name, job_title: u.job_title ?? '', role: u.role, is_active }),
      is_active ? `${u.full_name} can sign in again.` : `${u.full_name} is deactivated.`,
    );

  const resetPassword = (u: User, password: string) => run(() => usersApi.resetPassword(u.id, password), `Password reset for ${u.full_name}.`);

  const remove = (u: User) => run(() => usersApi.remove(u.id), `${u.full_name} deleted.`);

  return { users, save, setActive, resetPassword, remove };
}
