import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 });
}
