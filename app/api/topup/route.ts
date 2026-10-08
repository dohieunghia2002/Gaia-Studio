import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { handle, json, readJson } from '@/lib/api.server';
import { createTopup } from '@/lib/payments.server';

/** Tạo đơn nạp credit và mã QR PayOS. Body: { amountVnd }. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const { amountVnd } = await readJson<{ amountVnd?: number }>(req);
  const view = await createTopup(user.id, Number(amountVnd), req.nextUrl.origin);
  return json(view, 201);
});
