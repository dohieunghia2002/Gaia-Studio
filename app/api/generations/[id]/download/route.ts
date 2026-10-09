import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid } from '@/lib/api.server';
import { getDownloadable } from '@/lib/generations.server';

type Ctx = { params: Promise<{ id: string }> };

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/**
 * Tải file về máy. CDN của Gommo khác domain nên `<a download>` không ép tải được;
 * server lấy file rồi trả lại kèm Content-Disposition: attachment.
 */
export const GET = handle(async (_req: NextRequest, ctx: Ctx) => {
  const user = await requireUserApi();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này.');
  const row = await getDownloadable(user.id, id);
  const upstream = await fetch(row.url!, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) throw new ApiError(502, 'upstream', 'Không tải được file. Bạn thử lại sau.');
  const type = upstream.headers.get('content-type')?.split(';')[0] || (row.kind === 'video' ? 'video/mp4' : 'image/png');
  const ext = EXT[type] ?? (row.kind === 'video' ? 'mp4' : 'png');
  const name = `gaia-${row.kind === 'video' ? 'video' : 'image'}-${row.id.slice(0, 8)}.${ext}`;
  const headers = new Headers({
    'Content-Type': type,
    'Content-Disposition': `attachment; filename="${name}"`,
    'Cache-Control': 'private, no-store',
  });
  const length = upstream.headers.get('content-length');
  if (length) headers.set('Content-Length', length);
  return new Response(upstream.body, { headers });
});
