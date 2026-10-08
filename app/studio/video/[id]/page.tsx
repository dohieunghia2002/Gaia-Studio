import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUserPage } from '@/lib/auth.server';
import { getModel } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
import { priceFor, resolveSelection, selectionFields } from '@/lib/catalog';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { VideoDetail } from '@/components/detail/VideoDetail';

export const metadata: Metadata = { title: 'Chi tiết video' };

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/studio/video/${id}`);
  if (!isUuid(id)) notFound();
  const detail = await getDetail(user.id, id).catch(() => null);
  if (!detail) notFound();
  if (detail.root.kind === 'image') redirect(`/studio/image/${detail.root.id}`);

  const item = detail.root;
  const [balance, model] = await Promise.all([getBalance(user.id), getModel('video', item.model).catch(() => undefined)]);

  // "Tạo lại" chỉ hiện khi model còn bán đúng tổ hợp thông số cũ.
  let rerunCredits: number | null = null;
  if (model?.available) {
    const resolved = resolveSelection(model, item.params);
    if (selectionFields(model).every((f) => resolved[f] === item.params[f])) rerunCredits = priceFor(model, resolved);
  }

  return (
    <CreditProvider initial={balance}>
      <ToastProvider>
        <VideoDetail initialItem={item} model={model} rerunCredits={rerunCredits} />
      </ToastProvider>
    </CreditProvider>
  );
}
