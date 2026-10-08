import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json } from '@/lib/api.server';
import { getDetail, softDelete } from '@/lib/generations.server';

type Ctx = { params: Promise<{ id: string }> };

async function idFrom(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  return id;
}

export const GET = handle(async (_req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  return json(await getDetail(user.id, await idFrom(ctx)));
});

/** Xoá khỏi thư viện. ?scope=version chỉ xoá một phiên bản sửa. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const scope = req.nextUrl.searchParams.get('scope') === 'version' ? 'version' : 'item';
  return json(await softDelete(user.id, await idFrom(ctx), scope));
});
