import 'server-only';
import { NextResponse } from 'next/server';
import { GommoError } from './gommo';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Bọc handler: lỗi có chủ đích → JSON { error, message }; lỗi khác → 500 kèm log. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: err.code, message: err.message }, err.status);
      }
      if (err instanceof GommoError) {
        console.error('[gommo]', err.code, err.message);
        return json({ error: 'upstream', message: 'Hệ thống tạo ảnh/video đang gặp sự cố. Bạn thử lại sau ít phút.' }, 502);
      }
      console.error('[api]', err);
      return json({ error: 'server', message: 'Có lỗi xảy ra. Bạn thử lại sau ít phút.' }, 500);
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, 'bad_request', 'Dữ liệu gửi lên không hợp lệ.');
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
