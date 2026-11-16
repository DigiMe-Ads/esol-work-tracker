import { memo, type CSSProperties } from 'react';
import { Flag } from 'lucide-react';
import { PRIORITIES, STATUSES, priorityOf, statusOf } from '@/lib/constants';
import { initials } from '@/lib/format';
import type { Priority, Status } from '@/types';

const pillVar = (color: string) => ({ '--pill': color }) as CSSProperties;

export const StatusPill = memo(function StatusPill({ status }: { status: Status }) {
  const s = statusOf(status);
  return (
    <span className="pill" style={pillVar(s.color)}>
      <span className="dot" />
      {s.label}
    </span>
  );
});

/** Inline status changer that looks like the pill. */
export function StatusSelect({ value, onChange, disabled }: { value: Status; onChange: (s: Status) => void; disabled?: boolean }) {
  return (
    <select
      className="status-select"
      style={pillVar(statusOf(value).color)}
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as Status)}
      aria-label="Status"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

export const PriorityFlag = memo(function PriorityFlag({ priority }: { priority: Priority }) {
  const p = priorityOf(priority);
  return (
    <span className="flag" style={pillVar(p.color)}>
      <Flag size={13} fill={priority === 'low' ? 'none' : 'currentColor'} />
      {p.label}
    </span>
  );
});

export function PrioritySelect({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <select className="select select--sm" value={value} onChange={(e) => onChange(e.target.value as Priority)} aria-label="Priority">
      {PRIORITIES.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

export const Avatar = memo(function Avatar({ name, size }: { name: string | null; size?: 'lg' }) {
  return (
    <span className={`avatar${size ? ` avatar--${size}` : ''}${name ? '' : ' avatar--empty'}`} title={name ?? 'Unassigned'}>
      {name ? initials(name) : '–'}
    </span>
  );
});
