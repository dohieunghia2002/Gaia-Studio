import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { restoreDeleted } from '@/lib/generations.server';

type Ctx = { params: Promise<{ id: string }> };

/** Hoàn tác "Xoá khỏi thư viện". */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  const { deletedAt } = await readJson<{ deletedAt?: string }>(req);
  if (!isUuid(id) || typeof deletedAt !== 'string') throw new ApiError(400, 'bad_request', 'Không hoàn tác được.');
  await restoreDeleted(user.id, id, deletedAt);
  return json({ ok: true });
});
