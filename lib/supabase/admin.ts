import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseSecretKey, supabaseUrl } from '../env';

let admin: SupabaseClient | null = null;

/**
 * Client dùng khoá secret: bỏ qua RLS, chỉ dùng ở server. Mọi truy vấn qua client này
 * PHẢI tự lọc theo user_id của người đang đăng nhập.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(supabaseUrl()!, supabaseSecretKey()!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
