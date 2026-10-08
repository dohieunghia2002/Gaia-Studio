'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

export type ToastAction = { label: string; href?: string; onClick?: () => void };

export interface ToastInput {
  kind?: 'done' | 'error' | 'info';
  title: string;
  sub?: string;
  action?: ToastAction;
  /** ms; 0 = không tự đóng. Mặc định 6s, toast "đã xong" 10s. */
  duration?: number;
}

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<{ push: (t: ToastInput) => number; dismiss: (id: number) => void } | null>(null);

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts phải nằm trong <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { ...t, id }]);
      const ms = t.duration ?? (t.kind === 'done' ? 10_000 : 6_000);
      if (ms > 0) setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <div className="toast" key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.kind === 'done' && (
              <span className="accent" style={{ display: 'flex' }}>
                <Icon name="done" size={20} />
              </span>
            )}
            {t.kind === 'error' && (
              <span className="danger-text" style={{ display: 'flex' }}>
                <Icon name="alert" size={20} />
              </span>
            )}
            <span className="body">
              <span className="t" style={t.kind ? undefined : { fontWeight: 400 }}>
                {t.title}
              </span>
              {t.sub && <span className="s">{t.sub}</span>}
            </span>
            {t.action &&
              (t.action.href ? (
                <Link href={t.action.href} className="link-btn" onClick={() => dismiss(t.id)}>
                  {t.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    t.action?.onClick?.();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              ))}
            <button type="button" className="ghost-icon" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)}>
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
