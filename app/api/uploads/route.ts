import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, json, readJson } from '@/lib/api.server';
import { gommoUploadImage } from '@/lib/gommo';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

/** Upload ảnh (Start/End frame, Reference) lên Gommo. Body: { dataUrl, fileName }. */
export const POST = handle(async (req: NextRequest) => {
  await requireUserApi();
  const { dataUrl, fileName } = await readJson<{ dataUrl?: string; fileName?: string }>(req);
  const match = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? '');
  if (!match || !ALLOWED.includes(match[1])) {
    throw new ApiError(400, 'bad_file', 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.');
  }
  const size = Math.floor((match[2].length * 3) / 4);
  if (size > MAX_BYTES) throw new ApiError(400, 'too_large', 'Ảnh tối đa 10MB.');
  const safeName = (fileName || 'image').replace(/[^\w.-]+/g, '_').slice(0, 80) || 'image';
  const uploaded = await gommoUploadImage(match[2], safeName, size);
  return json(uploaded, 201);
});
