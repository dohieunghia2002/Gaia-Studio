import 'server-only';
import { requireEnv } from './env';

const BASE_URL = 'https://api.gommo.net';
const TIMEOUT_MS = 300_000;

export class GommoError extends Error {
  constructor(
    message: string,
    readonly code?: string | number,
  ) {
    super(message);
    this.name = 'GommoError';
  }
}

/**
 * Gọi Gommo: POST application/x-www-form-urlencoded, tự thêm access_token và domain.
 * Giá trị object/array được gửi dưới dạng chuỗi JSON; null/undefined bị bỏ qua.
 * Gommo báo lỗi trong body (`error`, `message`) nên body có `error` cũng ném GommoError.
 */
export async function gommoPost<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const params = new URLSearchParams();
  params.append('access_token', requireEnv('GOMMO_ACCESS_TOKEN'));
  params.append('domain', requireEnv('GOMMO_DOMAIN'));
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    params.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new GommoError(`Gommo trả về HTTP ${res.status}`, res.status);
    const data = (await res.json()) as Record<string, unknown>;
    if (data && data.error) {
      throw new GommoError(String(data.message || 'Gommo báo lỗi'), data.error as string | number);
    }
    return data as T;
  } catch (err) {
    if (err instanceof GommoError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GommoError(`Gommo không phản hồi sau ${TIMEOUT_MS / 1000} giây`, 'timeout');
    }
    throw new GommoError(err instanceof Error ? err.message : 'Không gọi được Gommo');
  } finally {
    clearTimeout(timer);
  }
}

// ── Kiểu dữ liệu Gommo trả về (chỉ các trường GAIA dùng) ──

export interface GommoImageInfo {
  id_base: string;
  status: string; // PENDING_ACTIVE | PENDING_PROCESSING | SUCCESS | ERROR
  url?: string | null;
  url_thumb?: string | null;
  url_preview?: string | null;
  credit?: number;
  message?: string;
  prompt?: string;
}

export interface GommoVideoInfo {
  id_base: string;
  status: string; // MEDIA_GENERATION_STATUS_*
  download_url?: string | null;
  thumbnail_url?: string | null;
  credit_fee?: number;
  message?: string;
  prompt?: string;
}

export const VIDEO_STATUS = {
  pending: 'MEDIA_GENERATION_STATUS_PENDING',
  active: 'MEDIA_GENERATION_STATUS_ACTIVE',
  processing: 'MEDIA_GENERATION_STATUS_PROCESSING',
  success: 'MEDIA_GENERATION_STATUS_SUCCESSFUL',
  failed: 'MEDIA_GENERATION_STATUS_FAILED',
} as const;

/**
 * Upload ảnh lên Gommo (bắt buộc với ảnh khung của create-video).
 * `base64` không có tiền tố `data:image/...;base64,`.
 */
export async function gommoUploadImage(base64: string, fileName: string, size: number) {
  const data = await gommoPost<{ imageInfo?: { id_base: string; url: string } }>('/ai/image-upload', {
    data: base64,
    project_id: 'default',
    file_name: fileName,
    size,
  });
  if (!data.imageInfo?.url) throw new GommoError('Gommo không trả về URL ảnh đã upload');
  return { id: data.imageInfo.id_base, url: data.imageInfo.url };
}

/**
 * CHƯA KIỂM CHỨNG: tài liệu Gommo không nói phần tử của `images` (create-video) và
 * `subjects` (generateImage) có dạng gì. Tạm gửi object { id_base, url } của ảnh đã upload.
 * Xác nhận ở lần chạy thử có phí đầu tiên rồi sửa đúng một chỗ này nếu cần.
 */
export function toGommoImageRefs(images: { id: string; url: string }[]) {
  return images.map((img) => ({ id_base: img.id, url: img.url }));
}
