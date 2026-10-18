import type { NextRequest } from 'next/server';
import { requireUserApi } from '@/lib/auth.server';
import { ApiError, handle, isUuid, json, readJson } from '@/lib/api.server';
import { MAX_BULK, purgeMany, restoreMany, softDeleteMany } from '@/lib/generations.server';

/**
 * Thao tác trên nhiều mục cùng lúc. Body: { action, ids, deletedAt? }.
 * - `trash`: chuyển vào Thùng rác → { rootIds, deletedAt } (dùng để Hoàn tác).
 * - `restore`: khôi phục; gửi kèm `deletedAt` để hoàn tác đúng lần chuyển đó → { restored }.
 * - `purge`: xoá vĩnh viễn mục trong Thùng rác, bỏ qua mục đang tạo dở → { deletedIds }.
 */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUserApi();
  const { action, ids, deletedAt } = await readJson<{ action?: string; ids?: unknown; deletedAt?: unknown }>(req);
  if (!Array.isArray(ids) || !ids.length || !ids.every(isUuid)) {
    throw new ApiError(400, 'bad_request', 'Danh sách mục không hợp lệ.');
  }
  if (ids.length > MAX_BULK) throw new ApiError(400, 'too_many', `Mỗi lần chọn tối đa ${MAX_BULK} mục.`);
  const unique = [...new Set(ids)];
  if (action === 'trash') return json(await softDeleteMany(user.id, unique));
  if (action === 'restore') {
    if (deletedAt !== undefined && typeof deletedAt !== 'string') throw new ApiError(400, 'bad_request', 'Không khôi phục được.');
    return json({ restored: await restoreMany(user.id, unique, deletedAt) });
  }
  if (action === 'purge') return json({ deletedIds: await purgeMany(user.id, unique) });
  throw new ApiError(400, 'bad_request', 'Thao tác không hợp lệ.');
});
