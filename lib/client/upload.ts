'use client';

import { api, ClientError } from './api';
import type { MediaRef } from '../types';

const MAX_SIDE = 2048;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];
// Vercel nhận tối đa 4,5 MB mỗi request (https://vercel.com/docs/functions/limitations), mà base64 nặng hơn file
// khoảng 33%. Giữ data URL dưới 4 MB để còn chỗ cho phần JSON còn lại.
const MAX_DATA_URL = 4_000_000;
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
 * rồi thu nhỏ còn cạnh dài tối đa 2048px, xuất JPEG dưới 4 MB. Ảnh đã đúng tỉ lệ, đủ nhỏ và dưới 3 MB thì gửi nguyên bản.
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
  const ctx = canvas.getContext('2d')!;
  // Luôn xuất JPEG: PNG vẽ lại từ canvas rất nặng (ảnh 2048px dễ quá 8 MB). Nền trắng cho phần trong suốt của PNG,
  // nếu không JPEG sẽ tô đen.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.92;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > MAX_DATA_URL && quality > 0.5) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > MAX_DATA_URL) throw new ClientError('Ảnh quá lớn. Bạn chọn ảnh khác nhé.', 400);
  return { dataUrl, cropped, changed: true };
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
