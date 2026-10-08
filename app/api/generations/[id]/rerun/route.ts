import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { rerunGeneration } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

type Ctx = { params: Promise<{ id: string }> };

/** "Thử lại" / "Tạo lại": tạo mới với đúng thông số cũ (tốn credit). */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  const { expectedCredits } = await readJson<{ expectedCredits?: number }>(req);
  const items = await rerunGeneration(user.id, id, Number(expectedCredits));
  return json({ items, balance: await getBalance(user.id) }, 201);
});
