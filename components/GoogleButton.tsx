'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export function GoogleButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setFailed(false);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setLoading(false);
      setFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 52, border: 0, borderRadius: 12, background: '#EDEBE6', color: '#0F0F0E', fontWeight: 600, fontSize: 15 }}
      >
        <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', background: '#0F0F0E', color: '#EDEBE6', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          G
        </span>
        {loading ? 'Đang chuyển sang Google…' : 'Tiếp tục với Google'}
      </button>
      {failed && (
        <p className="danger-text" style={{ margin: 0, fontSize: 13 }}>
          Không mở được trang đăng nhập Google. Bạn thử lại nhé.
        </p>
      )}
    </>
  );
}
