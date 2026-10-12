import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

// Bình thường Supabase Auth trả lời dưới 1 giây. Lúc project quá tải từng mất 12–14 giây mà vẫn trả lời được,
// nên không đặt quá sát: cắt sớm một lần làm mới token đã thành công ở Supabase thì token mới bị mất.
const AUTH_TIMEOUT_MS = 20_000;

/** fetch cho client Supabase Auth: có giới hạn thời gian, để trang không treo khi Supabase không trả lời. */
export const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(AUTH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
};

/**
 * Lỗi auth vì không hỏi được Supabase (mất mạng, quá giờ, 5xx, 429, trả về không phải JSON),
 * chứ không phải vì phiên đăng nhập không hợp lệ.
 */
export function isAuthUnavailable(error: unknown): boolean {
  if (!error) return false;
  if (isAuthRetryableFetchError(error)) return true;
  return isAuthError(error) && (error.name === 'AuthUnknownError' || error.status === 429);
}
