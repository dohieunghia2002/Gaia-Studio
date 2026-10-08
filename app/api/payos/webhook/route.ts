import type { NextRequest } from 'next/server';
import { verifyWebhook } from '@/lib/payos.server';
import { handlePaidWebhook } from '@/lib/payments.server';
import { isPayosConfigured, isSupabaseConfigured } from '@/lib/env';

/**
 * PayOS gọi vào đây khi nhận được tiền. Đăng ký URL này trong trang quản lý kênh thanh toán
 * của PayOS: https://<domain>/api/payos/webhook
 */
export async function POST(req: NextRequest) {
  if (!isPayosConfigured() || !isSupabaseConfigured()) {
    return Response.json({ success: false }, { status: 503 });
  }
  let body: { data?: Record<string, unknown>; signature?: string; success?: boolean; code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }
  if (!body.data || !verifyWebhook(body.data, body.signature ?? '')) {
    return Response.json({ success: false, message: 'invalid signature' }, { status: 400 });
  }
  try {
    if (body.code === '00' || body.success === true) await handlePaidWebhook(body.data);
  } catch (err) {
    console.error('[payos] xử lý webhook lỗi', err);
    return Response.json({ success: false }, { status: 500 }); // PayOS sẽ gửi lại
  }
  return Response.json({ success: true });
}
