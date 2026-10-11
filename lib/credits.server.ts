import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import type { CreditSummary, LedgerEntry, LedgerKind } from './types';

export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc('gaia_balance', { p_user: userId });
  if (error) throw error;
  return Number(data) || 0;
}

export async function getCreditSummary(userId: string): Promise<CreditSummary> {
  const balance = await getBalance(userId);
  const { data } = await supabaseAdmin()
    .from('credit_lots')
    .select('remaining, expires_at')
    .eq('user_id', userId)
    .gt('remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return {
    balance,
    nextExpiry: data ? { credits: data.remaining as number, expiresAt: data.expires_at as string } : null,
  };
}

type LedgerRow = {
  id: number;
  kind: LedgerKind;
  delta: number;
  balance_after: number;
  title: string;
  detail: string | null;
  created_at: string;
};

function toEntry(r: LedgerRow): LedgerEntry {
  return {
    id: r.id,
    kind: r.kind,
    delta: r.delta,
    balanceAfter: r.balance_after,
    title: r.title,
    detail: r.detail,
    createdAt: r.created_at,
  };
}

export async function getLedger(
  userId: string,
  opts: { kind?: LedgerKind; before?: number; limit?: number; order?: 'asc' | 'desc' } = {},
): Promise<{ entries: LedgerEntry[]; hasMore: boolean }> {
  // `before` là con trỏ phân trang: id của dòng cuối trang trước (theo chiều đang sắp xếp).
  const asc = opts.order === 'asc';
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  let q = supabaseAdmin()
    .from('credit_ledger')
    .select('id, kind, delta, balance_after, title, detail, created_at')
    .eq('user_id', userId)
    .order('id', { ascending: asc })
    .limit(limit + 1);
  if (opts.kind) q = q.eq('kind', opts.kind);
  if (opts.before) q = asc ? q.gt('id', opts.before) : q.lt('id', opts.before);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as LedgerRow[];
  return { entries: rows.slice(0, limit).map(toEntry), hasMore: rows.length > limit };
}
