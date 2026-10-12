'use client';

export class ClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

/** Gọi API của GAIA. Lỗi trả về `{ error, message }` thành ClientError với câu tiếng Việt. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...rest.headers } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: 'no-store',
    });
  } catch {
    throw new ClientError('Mất kết nối mạng. Bạn kiểm tra kết nối rồi thử lại.', 0, 'network');
  }
  if (res.status === 401 && typeof window !== 'undefined') {
    // Hàm thường (không phải component) nên không có router; phiên đã hết nên cố ý tải lại hẳn trang để xoá trạng thái cũ.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    throw new ClientError('Phiên đăng nhập đã hết hạn.', 401, 'unauthorized');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ClientError(
      (body && typeof body.message === 'string' && body.message) || 'Có lỗi xảy ra. Bạn thử lại sau ít phút.',
      res.status,
      body?.error,
    );
  }
  return body as T;
}
