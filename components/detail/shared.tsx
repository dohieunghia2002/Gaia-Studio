'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { useDismiss } from '../useDismiss';
import { useToasts } from '../Toasts';
import { api } from '@/lib/client/api';
import { fmtNumber } from '@/lib/format';
import type { GenerationItem } from '@/lib/types';

export const isRunning = (s: GenerationItem['status']) => s === 'pending' || s === 'processing';

/** Hỏi trạng thái job đang chạy mỗi 4 giây khi trang có job chưa xong. */
export function useSyncRunning(active: boolean, onUpdate: (items: GenerationItem[], balance: number) => void) {
  const cb = useRef(onUpdate);
  useEffect(() => {
    cb.current = onUpdate;
  }, [onUpdate]);
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    const run = async () => {
      try {
        const res = await api<{ items: GenerationItem[]; balance: number }>('/api/generations/sync', { method: 'POST' });
        if (!stopped) cb.current(res.items, res.balance);
      } catch {}
    };
    run();
    const t = setInterval(run, 4000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [active]);
}

/** Đồng hồ (ms) chạy mỗi giây khi `active`; null trước khi mount. */
export function useNow(active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = active ? setInterval(() => setNow(Date.now()), 1000) : undefined;
    return () => {
      clearTimeout(first);
      if (t) clearInterval(t);
    };
  }, [active]);
  return now;
}

export function MoreMenu({ width = 220, children }: { width?: number; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Thêm thao tác"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <div className="menu" style={{ right: 0, top: 'calc(100% + 8px)', width }}>
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function CopyPromptButton({ text }: { text: string }) {
  const { push } = useToasts();
  return (
    <button
      type="button"
      className="ghost-icon"
      aria-label="Sao chép prompt"
      title="Sao chép prompt"
      onClick={() =>
        navigator.clipboard
          .writeText(text)
          .then(() => push({ title: 'Đã sao chép prompt' }))
          .catch(() => push({ kind: 'error', title: 'Không sao chép được prompt' }))
      }
    >
      <Icon name="copy" />
    </button>
  );
}

export function StatusBlock({ item, now, what }: { item: GenerationItem; now: number | null; what: string }) {
  if (isRunning(item.status)) {
    const elapsed = now != null ? Math.max(0, now - new Date(item.createdAt).getTime()) : null;
    const mm = elapsed != null ? `${Math.floor(elapsed / 60000)}:${String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')}` : '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 24, textAlign: 'center' }}>
        <span className={item.status === 'processing' ? 'accent' : 'muted'} style={{ fontSize: 14, fontWeight: 600 }}>
          {item.status === 'processing' ? 'Đang render' : 'Đang chờ xử lý'}
          {mm && ` · ${mm}`}
        </span>
        <span className="muted" style={{ fontSize: 13 }}>
          Bạn có thể rời trang. Kết quả sẽ hiện trong thư viện khi xong.
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
      <span className="danger-text" style={{ display: 'flex' }}>
        <Icon name="alert" size={28} />
      </span>
      <span className="danger-text" style={{ fontSize: 15, fontWeight: 600 }}>
        Không tạo được {what}
      </span>
      <span className="muted" style={{ fontSize: 13, maxWidth: 360 }}>
        Hệ thống không xử lý được yêu cầu này. Bạn có thể thử lại, hoặc sửa prompt rồi tạo mới.
      </span>
      {item.refundedCredits > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Icon name="check" size={14} className="accent" />
          Đã hoàn {fmtNumber(item.refundedCredits)} credit
        </span>
      )}
    </div>
  );
}
