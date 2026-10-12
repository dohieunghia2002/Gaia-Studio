'use client';

import { api, ClientError } from './api';
import type { MediaRef } from '../types';

const MAX_SIDE = 2048;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];
// Lệch tỉ lệ dưới 1% thì coi như đã đúng, không cắt.
const RATIO_TOLERANCE = 0.01;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Ảnh người dùng chọn/dán: chỉ nhận PNG, JPG, WEBP tới 20MB. */
export function assertImageFile(file: File) {
  if (!ACCEPT.includes(file.type)) throw new ClientError('Chỉ nhận ảnh PNG, JPG hoặc WEBP.', 400);
  if (file.size > 20 * 1024 * 1024) throw new ClientError('Ảnh tối đa 20MB.', 400);
}

/** "16:9" → 16/9. "auto" hoặc giá trị lạ → null (không cắt). */
export function aspectOf(ratio: string | undefined): number | null {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(ratio ?? '');
  return m && Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
}

export interface PreparedImage {
  dataUrl: string;
  /** Đã cắt bớt phần ảnh để đúng tỉ lệ. */
  cropped: boolean;
  /** false: ảnh giữ nguyên (đúng tỉ lệ, đủ nhỏ), không cần tải lên lại nếu đã có trên Gommo. */
  changed: boolean;
}

/**
 * Chuẩn bị ảnh trước khi tải lên, trong một lần vẽ: cắt phần giữa cho đúng tỉ lệ `aspect` (nếu có)
 * rồi thu nhỏ còn cạnh dài tối đa 2048px.
 */
export async function prepareImage(blob: Blob, aspect: number | null = null): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(blob);
  let [sx, sy, sw, sh] = [0, 0, bitmap.width, bitmap.height];
  const current = sw / sh;
  const cropped = aspect != null && Math.abs(current / aspect - 1) > RATIO_TOLERANCE;
  if (cropped && current > aspect) {
    sw = Math.round(sh * aspect);
    sx = Math.round((bitmap.width - sw) / 2);
  } else if (cropped) {
    sh = Math.round(sw / aspect!);
    sy = Math.round((bitmap.height - sh) / 2);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  if (!cropped && scale === 1 && blob.size <= 3 * 1024 * 1024) {
    bitmap.close();
    return { dataUrl: await readAsDataUrl(blob), cropped: false, changed: false };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return { dataUrl: canvas.toDataURL(type, 0.92), cropped, changed: true };
}

export function uploadDataUrl(dataUrl: string, fileName: string): Promise<MediaRef> {
  return api<MediaRef>('/api/uploads', { method: 'POST', json: { dataUrl, fileName } });
}

/** Tải ảnh đã có trên CDN (vd. frame của lần tạo trước) về để cắt lại. */
export async function fetchImage(url: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ClientError('Không tải được ảnh. Bạn kiểm tra kết nối rồi thử lại.', 0, 'network');
  }
  if (!res.ok) throw new ClientError('Không tải được ảnh. Bạn chọn lại ảnh nhé.', res.status);
  return res.blob();
}

export async function uploadImage(file: File): Promise<MediaRef> {
  assertImageFile(file);
  const { dataUrl } = await prepareImage(file);
  return uploadDataUrl(dataUrl, file.name);
}
