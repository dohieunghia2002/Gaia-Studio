/**
 * Không hỏi được Supabase Auth (mất mạng, quá giờ, Supabase lỗi hoặc quá tải). Khác với "chưa đăng nhập":
 * không đẩy người dùng sang /login, chỉ báo lỗi và cho thử lại. Dùng được cả ở client (app/error.tsx).
 */
export const AUTH_UNAVAILABLE_DIGEST = 'GAIA_AUTH_UNAVAILABLE';
export const AUTH_UNAVAILABLE_MESSAGE = 'Không kết nối được máy chủ đăng nhập. Bạn thử lại sau ít phút.';
/**
 * proxy.ts gắn header này vào request khi vừa thử làm mới phiên mà không hỏi được Supabase, để trang báo lỗi
 * ngay thay vì thử lại thêm lần nữa. Người dùng tự gửi header này thì chỉ tự làm trang của mình báo lỗi.
 */
export const AUTH_UNAVAILABLE_HEADER = 'x-gaia-auth-unavailable';

export class AuthUnavailableError extends Error {
  // Next giữ nguyên `digest` có sẵn khi chuyển lỗi của Server Component sang error.tsx (cả ở production,
  // nơi `message` bị ẩn), nên trang lỗi nhận ra được trường hợp này.
  readonly digest = AUTH_UNAVAILABLE_DIGEST;

  constructor() {
    super(AUTH_UNAVAILABLE_MESSAGE);
    this.name = 'AuthUnavailableError';
  }
}
