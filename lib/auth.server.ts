import 'server-only';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './env';
import { createSupabaseServer } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';
import { ApiError } from './api.server';
import type { Profile } from './types';

/** Người dùng hiện tại (đã xác thực với Supabase), hoặc null. */
export async function getUser(): Promise<User | null> {
  // Luôn render theo request (kể cả khi chưa cấu hình Supabase), để build không "đóng băng" trang.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Dùng trong trang: chưa đăng nhập thì chuyển sang /login rồi quay lại `nextPath`. */
export async function requireUserPage(nextPath: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Dùng trong API route: chưa đăng nhập thì trả 401. */
export async function requireUserApi(): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new ApiError(503, 'not_configured', 'GAIA chưa được cấu hình đăng nhập.');
  }
  const user = await getUser();
  if (!user) throw new ApiError(401, 'unauthorized', 'Bạn cần đăng nhập để tiếp tục.');
  return user;
}

export async function getProfile(user: User): Promise<Profile> {
  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    id: user.id,
    email: data?.email ?? user.email ?? null,
    name: data?.full_name ?? meta.full_name ?? meta.name ?? null,
    avatarUrl: data?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
  };
}
