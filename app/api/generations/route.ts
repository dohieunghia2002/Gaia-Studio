import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { handle, json, readJson } from '@/lib/api.server';
import { createGenerations, listLibrary, type CreateRequest } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

/** Thư viện: ?kind=image|video&before=<created_at> */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const sp = req.nextUrl.searchParams;
  const kind = sp.get('kind');
  const result = await listLibrary(user.id, {
    kind: kind === 'image' || kind === 'video' ? kind : undefined,
    before: sp.get('before') ?? undefined,
  });
  return json(result);
});

/** Tạo ảnh/video: trừ credit rồi gửi Gommo. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const body = await readJson<CreateRequest>(req);
  const items = await createGenerations(user.id, body);
  return json({ items, balance: await getBalance(user.id) }, 201);
});
