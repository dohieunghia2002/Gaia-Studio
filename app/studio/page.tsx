import type { Metadata } from 'next';
import { getProfileRow, pageSession, toProfile } from '@/lib/auth.server';
import { getCatalog } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail, listLibrary, trashCount } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { StudioApp } from '@/components/studio/StudioApp';
import { promptHref } from '@/lib/suggestions';
import type { GenerationItem, Kind } from '@/lib/types';

export const metadata: Metadata = { title: 'Studio' };

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ reuse?: string; prompt?: string; kind?: string }>;
}) {
  const { reuse: reuseId, prompt, kind } = await searchParams;
  const text = typeof prompt === 'string' ? prompt.trim().slice(0, 2000) : '';
  const initialPrompt = text ? { kind: (kind === 'image' ? 'image' : 'video') as Kind, prompt: text } : null;
  const { userId, verified } = await pageSession(
    initialPrompt ? promptHref(initialPrompt.kind, initialPrompt.prompt) : '/studio',
  );

  // Xác thực và tải dữ liệu cùng lúc (xem pageSession).
  const [user, profileRow, balance, library, trash, catalog, reuse] = await Promise.all([
    verified,
    getProfileRow(userId),
    getBalance(userId),
    listLibrary(userId),
    trashCount(userId),
    getCatalog().catch(() => ({ image: [], video: [] })),
    reuseId && isUuid(reuseId)
      ? getDetail(userId, reuseId)
          .then((d): GenerationItem => d.versions.find((v) => v.id === reuseId) ?? d.root)
          .catch(() => null)
      : null,
  ]);
  const profile = toProfile(user, profileRow);

  return (
    <CreditProvider initial={balance}>
      <ToastProvider>
        <StudioApp
          profile={profile}
          initialItems={library.items}
          initialCursor={library.nextCursor}
          initialTrashCount={trash}
          initialCatalog={catalog}
          reuse={reuse}
          initialPrompt={reuse ? null : initialPrompt}
        />
      </ToastProvider>
    </CreditProvider>
  );
}
