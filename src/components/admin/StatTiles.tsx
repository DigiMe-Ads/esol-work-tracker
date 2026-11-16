import type { CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, ListTodo, Loader } from 'lucide-react';
import type { TeamProgress } from '@/types';

type NumericKey = 'total' | 'done' | 'in_progress' | 'overdue' | 'done_this_week';

/** Organisation-wide totals across every employee. */
export function StatTiles({ rows }: { rows: TeamProgress[] }) {
  const sum = (k: NumericKey) => rows.reduce((n, r) => n + r[k], 0);
  const tiles = [
    { label: 'Open tasks', value: sum('total') - sum('done'), icon: ListTodo, color: 'var(--accent)' },
    { label: 'In progress', value: sum('in_progress'), icon: Loader, color: 'var(--status-review)' },
    { label: 'Overdue', value: sum('overdue'), icon: AlertTriangle, color: 'var(--danger)' },
    { label: 'Done this week', value: sum('done_this_week'), icon: CheckCircle2, color: 'var(--success)' },
  ];
  return (
    <div className="stats">
      {tiles.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="stat glass" style={{ '--pill': color } as CSSProperties}>
          <div className="stat-icon">
            <Icon size={20} />
          </div>
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
