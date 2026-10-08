import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { upscaleImage } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

type Ctx = { params: Promise<{ id: string }> };

// Upscale của Gommo trả kết quả trong cùng request nên có thể lâu.
export const maxDuration = 300;

export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy ảnh này.');
  const { expectedCredits } = await readJson<{ expectedCredits?: number }>(req);
  const item = await upscaleImage(user.id, id, Number(expectedCredits));
  return json({ item, balance: await getBalance(user.id) }, 201);
});
