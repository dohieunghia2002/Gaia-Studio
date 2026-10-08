import type { Metadata } from 'next';
import { getProfile, requireUserPage } from '@/lib/auth.server';
import { getCreditSummary, getLedger } from '@/lib/credits.server';
import { getTopup } from '@/lib/payments.server';
import { isPayosConfigured } from '@/lib/env';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { CreditPage } from '@/components/credit/CreditPage';

export const metadata: Metadata = { title: 'Credit' };

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const user = await requireUserPage('/credit');
  const { order } = await searchParams;

  const [profile, summary, ledger] = await Promise.all([getProfile(user), getCreditSummary(user.id), getLedger(user.id)]);

  // Quay lại từ trang PayOS (?order=...) hoặc tải lại trang khi đang chờ chuyển khoản.
  const orderCode = Number(order);
  const resume = Number.isSafeInteger(orderCode) && orderCode > 0 ? await getTopup(user.id, orderCode).catch(() => null) : null;
  // Đã trả xong thì số dư có thể vừa đổi trong lúc hỏi PayOS.
  const finalSummary = resume?.status === 'paid' ? await getCreditSummary(user.id) : summary;
  const finalLedger = resume?.status === 'paid' ? await getLedger(user.id) : ledger;

  return (
    <CreditProvider initial={finalSummary.balance}>
      <ToastProvider>
        <CreditPage
          profile={profile}
          initialSummary={finalSummary}
          initialLedger={finalLedger}
          resume={resume && (resume.status === 'pending' || resume.status === 'paid') ? resume : null}
          paymentsEnabled={isPayosConfigured()}
        />
      </ToastProvider>
    </CreditProvider>
  );
}
