import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

/** Centred dialog. Closes on Escape or a click outside. */
export function Modal({ open, onClose, title, children, footer }: OverlayProps) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}

/** Side panel used for task details. */
export function SidePanel({ open, onClose, title, children }: Omit<OverlayProps, 'footer'>) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="panel glass" role="dialog" aria-modal="true">
        <div className="panel-head">
          <div className="spacer row">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
