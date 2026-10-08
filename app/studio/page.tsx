import type { Metadata } from 'next';
import { getProfile, requireUserPage } from '@/lib/auth.server';
import { getCatalog } from '@/lib/models.server';
import { getBalance } from '@/lib/credits.server';
import { getDetail, listLibrary } from '@/lib/generations.server';
import { isUuid } from '@/lib/api.server';
import { CreditProvider } from '@/components/CreditContext';
import { ToastProvider } from '@/components/Toasts';
import { StudioApp } from '@/components/studio/StudioApp';
import type { GenerationItem } from '@/lib/types';

export const metadata: Metadata = { title: 'Studio' };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ reuse?: string }> }) {
  const user = await requireUserPage('/studio');
  const { reuse: reuseId } = await searchParams;

  const [profile, balance, library, catalog] = await Promise.all([
    getProfile(user),
    getBalance(user.id),
    listLibrary(user.id),
    getCatalog().catch(() => ({ image: [], video: [] })),
  ]);

  let reuse: GenerationItem | null = null;
  if (reuseId && isUuid(reuseId)) {
    reuse = await getDetail(user.id, reuseId)
      .then((d) => d.versions.find((v) => v.id === reuseId) ?? d.root)
      .catch(() => null);
  }

  return (
    <CreditProvider initial={balance}>
      <ToastProvider>
        <StudioApp
          profile={profile}
          initialItems={library.items}
          initialCursor={library.nextCursor}
          initialCatalog={catalog}
          reuse={reuse}
        />
      </ToastProvider>
    </CreditProvider>
  );
}
