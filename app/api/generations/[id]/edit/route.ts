import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { editImage } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 120;

/** Tạo bản sửa từ một phiên bản ảnh. */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy ảnh này.');
  const body = await readJson<{ prompt?: string; model?: string; expectedCredits?: number }>(req);
  const item = await editImage(user.id, id, {
    prompt: body.prompt ?? '',
    model: body.model,
    expectedCredits: Number(body.expectedCredits),
  });
  return json({ item, balance: await getBalance(user.id) }, 201);
});
