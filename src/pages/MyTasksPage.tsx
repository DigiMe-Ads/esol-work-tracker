import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TaskWorkspace } from '@/components/tasks/TaskWorkspace';
import type { TaskScope } from '@/api/tasks';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const scope = useMemo<TaskScope>(() => ({ kind: 'mine', userId: user!.id }), [user]);
  return (
    <>
      <header className="page-head">
        <div>
          <h1>
            {greeting()}, <span className="accent">{user!.full_name.split(' ')[0]}</span>
          </h1>
          <p>Tasks assigned to you or created by you.</p>
        </div>
      </header>
      <TaskWorkspace scope={scope} />
    </>
  );
}
