import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

/** Google → Supabase → đây: đổi `code` lấy phiên đăng nhập rồi về trang người dùng định vào. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/studio';
  // Chỉ cho chuyển về đường dẫn nội bộ.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/studio';

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth] đổi code lỗi', error.message);
  }
  return NextResponse.redirect(`${origin}/login?error=1&next=${encodeURIComponent(next)}`);
}
