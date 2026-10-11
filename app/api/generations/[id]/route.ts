import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json } from '@/lib/api.server';
import { getDetail, purgeItem, softDelete } from '@/lib/generations.server';

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

/**
 * Mặc định: chuyển cả ảnh/video vào Thùng rác. ?scope=version: xoá một phiên bản sửa.
 * ?scope=permanent: xoá vĩnh viễn một mục đang trong Thùng rác.
 */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const id = await idFrom(ctx);
  const scope = req.nextUrl.searchParams.get('scope');
  if (scope === 'permanent') {
    await purgeItem(user.id, id);
    return json({ ok: true });
  }
  return json(await softDelete(user.id, id, scope === 'version' ? 'version' : 'item'));
});
