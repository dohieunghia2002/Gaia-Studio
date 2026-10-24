import type { NextRequest } from 'next/server';
import { ApiError, handle, json } from '@/lib/api.server';
import { syncAllRunning } from '@/lib/generations.server';

/**
 * Vercel Cron gọi mỗi ngày một lần (vercel.json; gói Hobby chỉ cho tối thiểu 1 lần/ngày).
 * Vercel tự gửi `Authorization: Bearer <CRON_SECRET>` khi project có biến CRON_SECRET
 * (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
 */
export const GET = handle(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    throw new ApiError(401, 'unauthorized', 'Không có quyền.');
  }
  return json(await syncAllRunning());
});
