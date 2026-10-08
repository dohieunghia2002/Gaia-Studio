import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Next 16: "proxy" thay cho "middleware". Mỗi request trang: làm mới phiên Supabase (ghi cookie mới
// nếu token hết hạn) và chặn trang cần đăng nhập. API route tự kiểm tra đăng nhập.

const PROTECTED = ['/studio', '/credit'];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  // getClaims() kiểm chữ ký JWT tại chỗ (khoá bất đối xứng) và làm mới token khi cần, nhanh hơn getUser().
  // Ở đây chỉ dùng để chuyển hướng; trang và API vẫn tự xác thực lại bằng getUser().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  if (!signedIn && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  if (signedIn && path === '/login') {
    const studio = request.nextUrl.clone();
    studio.pathname = '/studio';
    studio.search = '';
    return NextResponse.redirect(studio);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/|icon.svg|apple-icon.png|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
