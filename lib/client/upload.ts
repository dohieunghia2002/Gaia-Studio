'use client';

import { api, ClientError } from './api';
import type { MediaRef } from '../types';

const MAX_SIDE = 2048;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Thu nhỏ ảnh còn cạnh dài tối đa 2048px (giữ dung lượng gửi lên nhỏ). */
async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 3 * 1024 * 1024) {
    bitmap.close();
    return readAsDataUrl(file);
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(type, 0.92);
}

export async function uploadImage(file: File): Promise<MediaRef> {
  if (!ACCEPT.includes(file.type)) throw new ClientError('Chỉ nhận ảnh PNG, JPG hoặc WEBP.', 400);
  if (file.size > 20 * 1024 * 1024) throw new ClientError('Ảnh tối đa 20MB.', 400);
  const dataUrl = await downscale(file);
  return api<MediaRef>('/api/uploads', { method: 'POST', json: { dataUrl, fileName: file.name } });
}
