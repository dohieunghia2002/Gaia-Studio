// Phân trang thư viện theo ngày (24/10/2026): mỗi ngày 2 hàng × 4 thẻ = 8 mục một trang.
// Server (lib/generations.server.ts) và client (StudioApp) dùng chung các số này.

export const LIBRARY_PAGE_SIZE = 8;
/** Số ngày tải mỗi lần (lần đầu và mỗi lần bấm "Xem các ngày trước"). */
export const LIBRARY_DAYS_PER_LOAD = 7;

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
}

/** Chuỗi YYYY-MM-DD là một ngày có thật (vd. 2026-13-99 thì không). */
export function isDay(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
