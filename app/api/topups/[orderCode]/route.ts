import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, json } from '@/lib/api.server';
import { cancelTopup, getTopup } from '@/lib/payments.server';

type Ctx = { params: Promise<{ orderCode: string }> };

async function orderFrom(ctx: Ctx) {
  const { orderCode } = await ctx.params;
  const n = Number(orderCode);
  if (!Number.isSafeInteger(n) || n <= 0) throw new ApiError(404, 'not_found', 'Không tìm thấy đơn nạp này.');
  return n;
}

/** Trạng thái đơn nạp (client hỏi định kỳ trong lúc chờ chuyển khoản). */
export const GET = handle(async (_req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  return json(await getTopup(user.id, await orderFrom(ctx)));
});

/** Huỷ giao dịch đang chờ. */
export const DELETE = handle(async (_req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  return json(await cancelTopup(user.id, await orderFrom(ctx)));
});
