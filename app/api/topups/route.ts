import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, json, readJson } from '@/lib/api.server';
import { createTopup } from '@/lib/payments.server';
import { isPrivateGroup } from '@/lib/access';

/** Tạo đơn nạp credit và mã QR PayOS. Body: { amountVnd }. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  if (isPrivateGroup()) {
    throw new ApiError(403, 'topup_disabled', 'GAIA đang dùng riêng cho nhóm và không nhận nạp tiền. Bạn nhắn chủ nhóm để được cấp credit.');
  }
  const { amountVnd } = await readJson<{ amountVnd?: number }>(req);
  const view = await createTopup(user.id, Number(amountVnd), req.nextUrl.origin);
  return json(view, 201);
});
