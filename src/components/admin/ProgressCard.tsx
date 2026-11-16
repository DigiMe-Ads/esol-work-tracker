import { memo, type CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Badges';
import { STATUSES } from '@/lib/constants';
import type { TeamProgress } from '@/types';

/** One employee's workload: a stacked status bar, completion and overdue counts. */
export const ProgressCard = memo(function ProgressCard({ p, onOpen }: { p: TeamProgress; onOpen: (id: string) => void }) {
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  return (
    <article
      className={`person-card glass${p.is_active ? '' : ' person-card--inactive'}`}
      onClick={() => onOpen(p.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(p.id)}
    >
      <div className="row" style={{ gap: 12 }}>
        <Avatar name={p.full_name} size="lg" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="strong">{p.full_name}</div>
          <div className="small muted">
            {p.job_title || 'Employee'}
            {p.is_active ? '' : ' · inactive'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stat-value" style={{ fontSize: 20 }}>{pct}%</div>
          <div className="small faint">done</div>
        </div>
      </div>
      <div className="status-bar" aria-label={`${p.done} of ${p.total} tasks done`}>
        {STATUSES.map((s) =>
          p[s.value] ? <span key={s.value} style={{ width: `${(p[s.value] / p.total) * 100}%`, background: s.color }} title={`${s.label}: ${p[s.value]}`} /> : null,
        )}
      </div>
      <div className="legend">
        {STATUSES.map((s) => (
          <span key={s.value} style={{ '--pill': s.color } as CSSProperties}>
            <span className="dot" /> {s.label} {p[s.value]}
          </span>
        ))}
      </div>
      <div className="row small">
        <span className="row" style={{ gap: 4, color: 'var(--success)' }}>
          <CheckCircle2 size={14} /> {p.done_this_week} done this week
        </span>
        <span className="spacer" />
        {p.overdue > 0 && (
          <span className="row due--late" style={{ gap: 4 }}>
            <AlertTriangle size={14} /> {p.overdue} overdue
          </span>
        )}
      </div>
    </article>
  );
});
