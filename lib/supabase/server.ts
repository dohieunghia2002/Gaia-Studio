import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabasePublicKey, supabaseUrl } from '../env';
import { fetchWithTimeout } from './network';

/** Client Supabase theo phiên đăng nhập của người dùng (đọc/ghi cookie phiên). */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl()!, supabasePublicKey()!, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Gọi từ Server Component thì không ghi cookie được; proxy.ts đã làm mới phiên.
        }
      },
    },
  });
}
