import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { pageSession, preferAuthError } from '@/lib/auth.server';
import { getCatalog } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
import { isPrivateGroup } from '@/lib/access';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { ImageDetail } from '@/components/detail/ImageDetail';

export const metadata: Metadata = { title: 'Chi tiết ảnh' };

export default async function ImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, verified } = await pageSession(`/studio/image/${id}`);
  if (!isUuid(id)) notFound();
  // Xác thực và tải dữ liệu cùng lúc (xem pageSession).
  const [, detail, balance, catalog] = await Promise.all([
    verified,
    getDetail(userId, id).catch(() => null),
    getBalance(userId),
    getCatalog().catch(() => ({ image: [], video: [] })),
  ]).catch(preferAuthError(verified));
  if (!detail) notFound();
  if (detail.root.kind === 'video') redirect(`/studio/video/${detail.root.id}`);

  return (
    <CreditProvider initial={balance} canTopup={!isPrivateGroup()}>
      <ToastProvider>
        <ImageDetail
          initialRoot={detail.root}
          initialVersions={detail.versions}
          imageModels={catalog.image}
        />
      </ToastProvider>
    </CreditProvider>
  );
}
