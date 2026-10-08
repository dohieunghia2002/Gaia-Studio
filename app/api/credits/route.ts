import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { handle, json } from '@/lib/api.server';
import { getCreditSummary, getLedger } from '@/lib/credits.server';
import type { LedgerKind } from '@/lib/types';

const KINDS: LedgerKind[] = ['topup', 'use', 'refund', 'expire'];

/** Số dư + lịch sử credit: ?kind=topup|use|refund&before=<id>&limit=20 */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const sp = req.nextUrl.searchParams;
  const kind = sp.get('kind') as LedgerKind | null;
  const [summary, ledger] = await Promise.all([
    getCreditSummary(user.id),
    getLedger(user.id, {
      kind: kind && KINDS.includes(kind) ? kind : undefined,
      before: Number(sp.get('before')) || undefined,
      limit: Number(sp.get('limit')) || 20,
    }),
  ]);
  return json({ ...summary, ...ledger });
});
