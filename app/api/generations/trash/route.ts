import { requireUserApi } from '@/lib/auth.server';
import { handle, json } from '@/lib/api.server';
import { emptyTrash } from '@/lib/generations.server';

/** Dọn Thùng rác: xoá vĩnh viễn mọi mục trong đó (trừ mục đang tạo dở). */
export const DELETE = handle(async () => {
  const user = await requireUserApi();
  return json({ deleted: await emptyTrash(user.id) });
});
