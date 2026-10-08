import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireEnv } from './env';

// PayOS API v2 — https://payos.vn/docs/api/
// Chữ ký tạo link: HMAC_SHA256(checksum key) của
// "amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl".

const BASE_URL = 'https://api-merchant.payos.vn';

function headers() {
  return {
    'x-client-id': requireEnv('PAYOS_CLIENT_ID'),
    'x-api-key': requireEnv('PAYOS_API_KEY'),
    'Content-Type': 'application/json',
  };
}

function hmac(data: string): string {
  return createHmac('sha256', requireEnv('PAYOS_CHECKSUM_KEY')).update(data).digest('hex');
}

export interface PayosLink {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PayosInfo {
  id: string;
  orderCode: number;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: string; // PENDING | PAID | PROCESSING | CANCELLED | EXPIRED ...
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: headers(), cache: 'no-store' });
  const body = (await res.json().catch(() => null)) as { code?: string; desc?: string; data?: T } | null;
  if (!res.ok || !body || body.code !== '00' || !body.data) {
    throw new Error(`PayOS lỗi: ${body?.desc ?? res.status}`);
  }
  return body.data;
}

export async function createPaymentLink(input: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt: number;
}): Promise<PayosLink> {
  const signature = hmac(
    `amount=${input.amount}&cancelUrl=${input.cancelUrl}&description=${input.description}&orderCode=${input.orderCode}&returnUrl=${input.returnUrl}`,
  );
  return call<PayosLink>('/v2/payment-requests', {
    method: 'POST',
    body: JSON.stringify({ ...input, signature }),
  });
}

export async function getPaymentInfo(orderCode: number): Promise<PayosInfo> {
  return call<PayosInfo>(`/v2/payment-requests/${orderCode}`, { method: 'GET' });
}

export async function cancelPaymentLink(orderCode: number, reason: string): Promise<void> {
  await call(`/v2/payment-requests/${orderCode}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancellationReason: reason }),
  });
}

/** Chuỗi ký của webhook: các trường của `data` sắp theo tên, nối "key=value" bằng "&". */
function webhookSignData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((key) => {
      let value = data[key];
      if (Array.isArray(value)) value = JSON.stringify(value);
      if (value === null || value === undefined || value === 'null' || value === 'undefined') value = '';
      return `${key}=${value}`;
    })
    .join('&');
}

export function verifyWebhook(data: Record<string, unknown>, signature: string): boolean {
  if (!data || typeof signature !== 'string' || !signature) return false;
  const expected = hmac(webhookSignData(data));
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
