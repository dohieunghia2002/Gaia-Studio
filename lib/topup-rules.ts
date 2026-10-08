// Quy tắc nạp credit (đã chốt 2026-10-06): 1.000đ = 10 credit, tối thiểu 20.000đ,
// nạp từ 200.000đ thưởng 5%, từ 500.000đ thưởng 10%, credit có hạn 90 ngày kể từ ngày nạp.

export const VND_PER_CREDIT = 100;
export const MIN_TOPUP_VND = 20_000;
export const MAX_TOPUP_VND = 50_000_000;
export const TOPUP_STEP_VND = 1_000;
export const TOPUP_PRESETS = [50_000, 100_000, 200_000, 500_000];
export const CREDIT_VALIDITY_DAYS = 90;

export function bonusPercent(vnd: number): number {
  if (vnd >= 500_000) return 10;
  if (vnd >= 200_000) return 5;
  return 0;
}

export function topupCredits(vnd: number) {
  const base = Math.floor(vnd / VND_PER_CREDIT);
  const bonus = Math.floor((base * bonusPercent(vnd)) / 100);
  return { base, bonus, total: base + bonus };
}

/** Thông báo lỗi nếu số tiền không hợp lệ, `null` nếu hợp lệ. */
export function validateTopupAmount(vnd: number): string | null {
  if (!Number.isInteger(vnd) || vnd < MIN_TOPUP_VND) return 'Số tiền tối thiểu là 20.000đ';
  if (vnd > MAX_TOPUP_VND) return 'Số tiền tối đa mỗi lần là 50.000.000đ';
  if (vnd % TOPUP_STEP_VND !== 0) return 'Số tiền phải là bội số của 1.000đ';
  return null;
}
