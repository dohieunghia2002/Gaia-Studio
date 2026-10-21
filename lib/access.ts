// Chế độ nhóm riêng (chủ dự án chọn 21/10/2026): GAIA chỉ cho những người được mời dùng và không bán credit.
// - GAIA_ALLOWED_EMAILS có email: chỉ những email đó đăng nhập được, tắt nạp tiền, chủ nhóm cấp credit bằng gaia_grant.
// - Bỏ trống: ai có tài khoản Google cũng đăng nhập được và nạp qua PayOS (khi mở bán công khai).
// Không import 'server-only' vì proxy.ts cũng dùng file này. Không đưa vào client: biến môi trường không có tiền tố
// NEXT_PUBLIC_ nên ở trình duyệt luôn rỗng.

/** Mã lỗi `?error=` ở trang đăng nhập khi email chưa được mời. */
export const NOT_INVITED = 'not_invited';

let cache: { raw: string; emails: Set<string> } | null = null;

function allowedEmails(): Set<string> {
  const raw = process.env.GAIA_ALLOWED_EMAILS ?? '';
  if (cache?.raw !== raw) {
    const emails = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    cache = { raw, emails: new Set(emails) };
  }
  return cache.emails;
}

/** Đang ở chế độ nhóm riêng. */
export function isPrivateGroup(): boolean {
  return allowedEmails().size > 0;
}

/** Email này được dùng GAIA không. Ở chế độ công khai thì ai cũng được. */
export function isEmailAllowed(email: string | null | undefined): boolean {
  const emails = allowedEmails();
  if (emails.size === 0) return true;
  return Boolean(email) && emails.has(email!.trim().toLowerCase());
}
