import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUserPage } from '@/lib/auth.server';
import { getCatalog } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
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

  return (
    <CreditProvider initial={balance}>
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
