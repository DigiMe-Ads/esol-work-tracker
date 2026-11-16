import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/format';
import { EmptyState, Loading } from '@/components/ui/States';
import { StatTiles } from '@/components/admin/StatTiles';
import { ProgressCard } from '@/components/admin/ProgressCard';
import type { TeamProgress } from '@/types';

/** Admin dashboard: totals plus a progress card per employee. Click a card to see their tasks. */
export default function TeamPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<TeamProgress[] | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await usersApi.teamProgress());
    } catch (err) {
      toast.error(errorMessage(err));
      setRows((r) => r ?? []);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const open = useCallback((id: string) => navigate(`/all?assignee=${id}`), [navigate]);
  const active = rows?.filter((r) => r.is_active) ?? [];
  const inactive = rows?.filter((r) => !r.is_active && r.total > 0) ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Team <span className="accent">overview</span></h1>
          <p>Progress on top-level tasks for every employee.</p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No employees yet">
          Add employees on the Employees page, then assign them tasks.
        </EmptyState>
      ) : (
        <>
          <StatTiles rows={rows} />
          <div className="people-grid">
            {[...active, ...inactive].map((p) => (
              <ProgressCard key={p.id} p={p} onOpen={open} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
