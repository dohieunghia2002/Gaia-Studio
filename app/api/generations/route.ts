import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { handle, json, readJson } from '@/lib/api.server';
import {
  createGenerations,
  listLibrary,
  listLibraryDay,
  listLibraryDays,
  runningCount,
  trashCount,
  type CreateRequest,
} from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

/**
 * Thư viện, gom theo ngày (mỗi ngày 8 mục một trang):
 * - ?kind=image|video&before=YYYY-MM-DD → các ngày gần nhất (trước `before`), mỗi ngày kèm trang đầu.
 * - ?day=YYYY-MM-DD&page=N&kind=… → một trang của một ngày.
 * Thùng rác: ?trash=1&before=<con trỏ>, danh sách phẳng theo lúc xoá.
 */
export const GET = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const sp = req.nextUrl.searchParams;
  const k = sp.get('kind');
  const kind = k === 'image' || k === 'video' ? k : undefined;
  const before = sp.get('before') ?? undefined;
  if (sp.get('trash') === '1') {
    const [result, trash] = await Promise.all([listLibrary(user.id, { before, trash: true }), trashCount(user.id)]);
    return json({ ...result, trashCount: trash });
  }
  const day = sp.get('day');
  if (day) return json(await listLibraryDay(user.id, { kind, day, page: Number(sp.get('page')) || 1 }));
  const [result, trash, running] = await Promise.all([
    listLibraryDays(user.id, { kind, before }),
    trashCount(user.id),
    runningCount(user.id),
  ]);
  return json({ ...result, trashCount: trash, runningCount: running });
});

/** Tạo ảnh/video: trừ credit rồi gửi Gommo. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const body = await readJson<CreateRequest>(req);
  const items = await createGenerations(user.id, body);
  return json({ items, balance: await getBalance(user.id) }, 201);
});
