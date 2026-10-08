import { getCatalog } from '@/lib/models.server';
import { handle, json } from '@/lib/api.server';

/** Danh mục model kèm giá credit GAIA (công khai, không cần đăng nhập). */
export const GET = handle(async () => {
  const catalog = await getCatalog();
  return json(catalog);
});
