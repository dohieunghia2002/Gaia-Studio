'use client';

import { Icon } from '../Icon';

/** Số trang hiển thị: đủ cả khi ≤ 6 trang, nhiều hơn thì trang đầu, cuối, trang đang xem ± 1 và dấu "…". */
export function pageItems(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 6) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  for (const p of keep) {
    const prev = out[out.length - 1];
    if (typeof prev === 'number' && p - prev === 2) out.push(prev + 1);
    else if (typeof prev === 'number' && p - prev > 2) out.push('gap');
    out.push(p);
  }
  return out;
}

/** Nút chuyển trang của một ngày trong thư viện, đặt cạnh tiêu đề ngày. */
export function DayPager({
  label,
  page,
  pages,
  busy,
  onPage,
}: {
  label: string;
  page: number;
  pages: number;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <nav className="pager" aria-label={`Trang của ${label}`}>
      <button type="button" className="pager-btn" aria-label="Trang trước" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>
        <Icon name="chevron-left" size={16} />
      </button>
      {pageItems(page, pages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="pager-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className="pager-btn"
            aria-label={`Trang ${p}`}
            aria-current={p === page ? 'page' : undefined}
            disabled={busy && p !== page}
            onClick={() => p !== page && onPage(p)}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className="pager-btn" aria-label="Trang sau" disabled={busy || page >= pages} onClick={() => onPage(page + 1)}>
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
