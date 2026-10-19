import 'server-only';
import QRCode from 'qrcode';
import { supabaseAdmin } from './supabase/admin';
import { ApiError } from './api.server';
import { envNumber, isPayosConfigured, siteUrl } from './env';
import { getProviderBalance } from './gommo';
import { cancelPaymentLink, createPaymentLink, getPaymentInfo } from './payos.server';
import { topupCredits, validateTopupAmount } from './topup-rules';
import { bankName } from './banks';
import { fmtNumber, fmtVnd } from './format';
import type { TopupView } from './types';

const LINK_TTL_SECONDS = 30 * 60;

type PaymentRow = {
  id: string;
  user_id: string;
  order_code: number;
  amount_vnd: number;
  credits: number;
  bonus_credits: number;
  status: TopupView['status'];
  description: string | null;
  checkout_url: string | null;
  qr_code: string | null;
  bank_bin: string | null;
  account_number: string | null;
  account_name: string | null;
  expires_at: string | null;
};

const db = () => supabaseAdmin();

async function toView(p: PaymentRow): Promise<TopupView> {
  const qrSvg =
    p.status === 'pending' && p.qr_code
      ? await QRCode.toString(p.qr_code, { type: 'svg', margin: 0, color: { dark: '#0F0F0E', light: '#EDEBE6' } })
      : null;
  return {
    orderCode: Number(p.order_code),
    status: p.status,
    amountVnd: p.amount_vnd,
    credits: p.credits,
    bonusCredits: p.bonus_credits,
    qrSvg,
    bankName: bankName(p.bank_bin),
    accountNumber: p.account_number,
    accountName: p.account_name,
    description: p.description,
    checkoutUrl: p.checkout_url,
  };
}

function newOrderCode(): number {
  // 13 chữ số: thời gian (ms) + 2 số ngẫu nhiên. Nằm trong giới hạn số nguyên an toàn của JS.
  const t = Date.now() % 1e11;
  return t * 100 + Math.floor(Math.random() * 100);
}

export async function createTopup(userId: string, amountVnd: number, origin: string): Promise<TopupView> {
  const invalid = validateTopupAmount(amountVnd);
  if (invalid) throw new ApiError(400, 'bad_amount', invalid);
  if (!isPayosConfigured()) {
    throw new ApiError(503, 'payment_not_configured', 'Thanh toán đang được thiết lập. Bạn quay lại sau nhé.');
  }
  // Chốt an toàn: tài khoản Gommo (79ai) sắp cạn thì không nhận tiền, để không ai trả tiền mà không tạo được gì.
  // Bật bằng GAIA_TOPUP_MIN_PROVIDER_BALANCE (credit Gommo); mặc định 0 = tắt, để thử PayOS trên máy.
  const minProvider = envNumber('GAIA_TOPUP_MIN_PROVIDER_BALANCE', 0);
  if (minProvider > 0) {
    const balance = await getProviderBalance();
    if (balance != null && balance < minProvider) {
      console.error('[provider] tạm dừng nạp credit: số dư Gommo thấp', { balance, minProvider });
      throw new ApiError(503, 'topup_paused', 'GAIA đang tạm dừng nạp credit. Bạn chưa bị trừ tiền. Bạn thử lại sau nhé.');
    }
  }
  const { base, bonus } = topupCredits(amountVnd);

  let row: PaymentRow | null = null;
  for (let attempt = 0; attempt < 3 && !row; attempt++) {
    const orderCode = newOrderCode();
    const { data, error } = await db()
      .from('payments')
      .insert({
        user_id: userId,
        order_code: orderCode,
        amount_vnd: amountVnd,
        credits: base,
        bonus_credits: bonus,
        description: `GAIA${orderCode.toString(36).toUpperCase().slice(-5)}`,
        expires_at: new Date(Date.now() + LINK_TTL_SECONDS * 1000).toISOString(),
      })
      .select('*')
      .single();
    if (!error) row = data as PaymentRow;
    else if (error.code !== '23505') throw error; // 23505 = trùng mã đơn, thử mã khác
  }
  if (!row) throw new ApiError(500, 'server', 'Không tạo được đơn nạp. Bạn thử lại nhé.');

  const site = siteUrl(origin);
  try {
    const link = await createPaymentLink({
      orderCode: Number(row.order_code),
      amount: amountVnd,
      description: row.description!,
      returnUrl: `${site}/credit?order=${row.order_code}`,
      cancelUrl: `${site}/credit?order=${row.order_code}`,
      expiredAt: Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS,
    });
    const { data, error } = await db()
      .from('payments')
      .update({
        payment_link_id: link.paymentLinkId,
        checkout_url: link.checkoutUrl,
        qr_code: link.qrCode,
        bank_bin: link.bin,
        account_number: link.accountNumber,
        account_name: link.accountName,
        description: link.description || row.description,
      })
      .eq('id', row.id)
      .select('*')
      .single();
    if (error) throw error;
    return toView(data as PaymentRow);
  } catch (err) {
    console.error('[topup] tạo link PayOS lỗi', err instanceof Error ? err.message : err);
    await db().from('payments').update({ status: 'cancelled' }).eq('id', row.id);
    throw new ApiError(502, 'payment_failed', 'Không tạo được mã thanh toán. Bạn thử lại sau ít phút.');
  }
}

async function applyTopup(p: PaymentRow, raw: unknown): Promise<boolean> {
  const detail = `Chuyển khoản ${fmtVnd(p.amount_vnd)}${p.bonus_credits ? ` · gồm ${fmtNumber(p.bonus_credits)} credit thưởng` : ''}`;
  const { data, error } = await db().rpc('gaia_apply_topup', {
    p_payment: p.id,
    p_raw: raw ?? null,
    p_title: 'Nạp credit',
    p_detail: detail,
  });
  if (error) throw error;
  return Boolean(data);
}

async function findByOrder(orderCode: number, userId?: string): Promise<PaymentRow | null> {
  let q = db().from('payments').select('*').eq('order_code', orderCode);
  if (userId) q = q.eq('user_id', userId);
  const { data } = await q.maybeSingle();
  return (data as PaymentRow) ?? null;
}

/** Trạng thái đơn nạp. Đơn còn chờ thì hỏi PayOS luôn (khỏi phụ thuộc webhook, tiện khi chạy local). */
export async function getTopup(userId: string, orderCode: number): Promise<TopupView> {
  let p = await findByOrder(orderCode, userId);
  if (!p) throw new ApiError(404, 'not_found', 'Không tìm thấy đơn nạp này.');
  if (p.status === 'pending' && isPayosConfigured()) {
    try {
      const info = await getPaymentInfo(orderCode);
      if (info.status === 'PAID' || info.amountPaid >= p.amount_vnd) {
        await applyTopup(p, info);
      } else if (info.status === 'CANCELLED' || info.status === 'EXPIRED') {
        await db()
          .from('payments')
          .update({ status: info.status === 'CANCELLED' ? 'cancelled' : 'expired' })
          .eq('id', p.id)
          .eq('status', 'pending');
      }
      p = (await findByOrder(orderCode, userId)) ?? p;
    } catch (err) {
      console.error('[topup] hỏi PayOS lỗi', err instanceof Error ? err.message : err);
    }
  }
  return toView(p);
}

export async function cancelTopup(userId: string, orderCode: number): Promise<TopupView> {
  const p = await findByOrder(orderCode, userId);
  if (!p) throw new ApiError(404, 'not_found', 'Không tìm thấy đơn nạp này.');
  if (p.status === 'pending') {
    try {
      await cancelPaymentLink(orderCode, 'Người dùng huỷ');
    } catch (err) {
      console.error('[topup] huỷ link PayOS lỗi', err instanceof Error ? err.message : err);
    }
    await db().from('payments').update({ status: 'cancelled' }).eq('id', p.id).eq('status', 'pending');
  }
  return getTopup(userId, orderCode);
}

/** Webhook PayOS đã xác thực chữ ký: cộng credit nếu đúng đơn và đủ tiền. */
export async function handlePaidWebhook(data: Record<string, unknown>): Promise<void> {
  const orderCode = Number(data.orderCode);
  if (!Number.isFinite(orderCode)) return;
  const p = await findByOrder(orderCode);
  if (!p) return; // vd webhook thử của PayOS khi xác nhận URL
  if (data.code !== undefined && data.code !== '00') return;
  if (Number(data.amount) < p.amount_vnd) {
    console.error('[payos] số tiền nhận nhỏ hơn đơn', orderCode, data.amount, p.amount_vnd);
    return;
  }
  await applyTopup(p, data);
}
