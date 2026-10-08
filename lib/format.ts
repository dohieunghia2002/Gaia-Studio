// Định dạng số và thời gian theo kiểu Việt Nam. Luôn dùng múi giờ Việt Nam để server và
// trình duyệt render ra cùng một chuỗi (tránh lệch khi hydrate).

const TZ = 'Asia/Ho_Chi_Minh';

export function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('vi-VN');
}

export function fmtVnd(n: number): string {
  return `${fmtNumber(n)}đ`;
}

/** +2.100 / −50 (dấu trừ thật, không phải gạch nối). */
export function fmtDelta(n: number): string {
  return n >= 0 ? `+${fmtNumber(n)}` : `−${fmtNumber(Math.abs(n))}`;
}

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parts(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const p: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(d)) p[part.type] = part.value;
  return { y: p.year, m: p.month, d: p.day, hh: p.hour, mm: p.minute };
}

/** "06/10 · 14:05" */
export function fmtDayMonthTime(iso: string): string {
  const p = parts(iso);
  return `${p.d}/${p.m} · ${p.hh}:${p.mm}`;
}

/** "14:05" */
export function fmtTime(iso: string): string {
  const p = parts(iso);
  return `${p.hh}:${p.mm}`;
}

/** "06/10/2026" */
export function fmtDate(iso: string): string {
  const p = parts(iso);
  return `${p.d}/${p.m}/${p.y}`;
}

/** Khoá ngày theo giờ Việt Nam, vd "2026-10-06". */
export function dayKey(iso: string | Date): string {
  const p = parts(iso);
  return `${p.y}-${p.m}-${p.d}`;
}

function yesterdayKey(now: Date): string {
  return dayKey(new Date(now.getTime() - 86_400_000));
}

/** "Hôm nay" / "Hôm qua" / "06/10/2026" cho tiêu đề nhóm trong thư viện. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const key = dayKey(iso);
  if (key === dayKey(now)) return 'Hôm nay';
  if (key === yesterdayKey(now)) return 'Hôm qua';
  return fmtDate(iso);
}

/** "Hôm nay, 14:32" / "Hôm qua, 09:10" / "06/10, 14:32" */
export function fmtWhen(iso: string, now: Date = new Date()): string {
  const key = dayKey(iso);
  const time = fmtTime(iso);
  if (key === dayKey(now)) return `Hôm nay, ${time}`;
  if (key === yesterdayKey(now)) return `Hôm qua, ${time}`;
  const p = parts(iso);
  return `${p.d}/${p.m}, ${time}`;
}

/** Thời gian đã trôi qua: "0:08", "12:40", "1:02:03". */
export function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Độ dài video từ số giây: "0:08". */
export function fmtClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return fmtElapsed(seconds * 1000);
}

/** "00:03" cho bộ điều khiển video. */
export function fmtClockPadded(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function clampText(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
