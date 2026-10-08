import { requireUserApi } from '@/lib/auth.server';
import { handle, json } from '@/lib/api.server';
import { syncRunning } from '@/lib/generations.server';
import { getBalance } from '@/lib/credits.server';

/** Cập nhật trạng thái các job đang chạy (client gọi định kỳ khi còn job chưa xong). */
export const POST = handle(async () => {
  const user = await requireUserApi();
  const items = await syncRunning(user.id);
  return json({ items, balance: await getBalance(user.id) });
});
