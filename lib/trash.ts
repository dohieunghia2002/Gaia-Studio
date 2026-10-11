// Thùng rác: dùng chung cho server (tự xoá) và giao diện (đếm ngày còn lại).

/** Mục trong Thùng rác tự xoá vĩnh viễn sau số ngày này. */
export const TRASH_DAYS = 30;

const DAY_MS = 24 * 60 * 60_000;

/** Số ngày còn lại trước khi tự xoá vĩnh viễn (0 = hôm nay). */
export function trashDaysLeft(deletedAt: string, now: number): number {
  const passed = Math.floor((now - new Date(deletedAt).getTime()) / DAY_MS);
  return Math.max(0, TRASH_DAYS - passed);
}
