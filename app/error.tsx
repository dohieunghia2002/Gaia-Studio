'use client';

import Link from 'next/link';
import { LogoMark } from '@/components/Icon';
import { AUTH_UNAVAILABLE_DIGEST, AUTH_UNAVAILABLE_MESSAGE } from '@/lib/auth-unavailable';

/** Lỗi khi tải trang. Cho thử lại tại chỗ, không đẩy người dùng sang /login. */
export default function PageError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const authDown = error.digest === AUTH_UNAVAILABLE_DIGEST;
  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <LogoMark size={40} />
      <h1 style={{ margin: 0, fontSize: 22 }}>Chưa tải được trang này</h1>
      <p className="muted" style={{ margin: 0, maxWidth: 360 }}>
        {authDown ? AUTH_UNAVAILABLE_MESSAGE : 'Có lỗi khi tải trang. Bạn thử lại sau ít phút.'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        <button type="button" className="primary" onClick={() => retry()} style={{ width: 'auto', height: 44, padding: '0 20px' }}>
          Thử lại
        </button>
        <Link href="/" className="ghost" style={{ width: 'auto', padding: '0 20px' }}>
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
