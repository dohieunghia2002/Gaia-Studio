import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { editImage } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 120;

/** Tạo một hoặc nhiều bản sửa (quantity 1–4) từ một phiên bản ảnh. */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy ảnh này.');
  const body = await readJson<{ prompt?: string; model?: string; expectedCredits?: number; quantity?: number }>(req);
  const items = await editImage(user.id, id, {
    prompt: body.prompt ?? '',
    model: body.model,
    expectedCredits: Number(body.expectedCredits),
    quantity: Number(body.quantity) || 1,
  });
  return json({ items, balance: await getBalance(user.id) }, 201);
});
