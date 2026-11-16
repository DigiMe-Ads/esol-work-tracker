import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon size={36} strokeWidth={1.6} />
      <h3>{title}</h3>
      {children && <p className="small">{children}</p>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="empty" aria-busy="true">
      <div className="spinner" />
      <span className="small">{label}</span>
    </div>
  );
}
