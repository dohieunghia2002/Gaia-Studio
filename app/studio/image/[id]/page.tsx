import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUserPage } from '@/lib/auth.server';
import { getCatalog, gaiaCredits, UPSCALE_GOMMO_FROM } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail, upscaleCredits } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
import { fmtNumber } from '@/lib/format';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { ImageDetail } from '@/components/detail/ImageDetail';

export const metadata: Metadata = { title: 'Chi tiết ảnh' };

export default async function ImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/studio/image/${id}`);
  if (!isUuid(id)) notFound();
  const detail = await getDetail(user.id, id).catch(() => null);
  if (!detail) notFound();
  if (detail.root.kind === 'video') redirect(`/studio/video/${detail.root.id}`);

  const [balance, catalog] = await Promise.all([getBalance(user.id), getCatalog().catch(() => ({ image: [], video: [] }))]);
  const hold = upscaleCredits();
  // Khi đã bật hoàn chênh lệch theo giá thật thì hiện "từ X", còn không thì hiện đúng số sẽ trừ.
  const label =
    process.env.GAIA_SETTLE_ACTUAL_COST === '1'
      ? `từ ${fmtNumber(gaiaCredits(UPSCALE_GOMMO_FROM))} credit`
      : `${fmtNumber(hold)} credit`;

  return (
    <CreditProvider initial={balance}>
      <ToastProvider>
        <ImageDetail
          initialRoot={detail.root}
          initialVersions={detail.versions}
          imageModels={catalog.image}
          upscale={{ credits: hold, label }}
        />
      </ToastProvider>
    </CreditProvider>
  );
}
