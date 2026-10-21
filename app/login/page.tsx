import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, LogoMark } from '@/components/Icon';
import { GoogleButton } from '@/components/GoogleButton';
import { isSupabaseConfigured } from '@/lib/env';
import { AUTH_UNAVAILABLE_MESSAGE } from '@/lib/auth-unavailable';
import { isPrivateGroup, NOT_INVITED } from '@/lib/access';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/studio';
  const configured = isSupabaseConfigured();
  const privateGroup = isPrivateGroup();
  // Đi từ khung prompt ở trang chủ: cho người dùng thấy prompt của họ không bị mất.
  const carried = new URL(safeNext, 'http://gaia.local').searchParams.get('prompt')?.trim();

  return (
    <div className="page">
      <header style={{ padding: '12px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Link href="/" className="logo">
          <LogoMark className="mark" />
          GAIA
        </Link>
        <Link href="/" className="back">
          <Icon name="arrow-left" size={18} />
          Trang chủ
        </Link>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px 96px' }}>
        <div className="panel" style={{ width: '100%', maxWidth: 400, padding: '32px 28px', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <LogoMark size={48} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.25, fontWeight: 700 }}>Đăng nhập vào GAIA</h1>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {privateGroup
                ? 'GAIA đang dùng riêng cho một nhóm nhỏ. Dùng tài khoản Google có email đã được mời.'
                : 'Dùng tài khoản Google của bạn. Lần đầu đăng nhập, GAIA sẽ tự tạo tài khoản.'}
            </p>
          </div>
          {carried && (
            <div className="carried">
              <span>Prompt của bạn sẽ được giữ lại sau khi đăng nhập</span>
              <p>{carried}</p>
            </div>
          )}
          {error && (
            <p className="danger-text" style={{ margin: 0, fontSize: 13 }}>
              {error === 'network'
                ? AUTH_UNAVAILABLE_MESSAGE
                : error === NOT_INVITED
                  ? 'Email này chưa được mời dùng GAIA. Bạn nhắn chủ nhóm để được thêm vào, hoặc đăng nhập bằng email khác.'
                  : 'Đăng nhập chưa thành công. Bạn thử lại nhé.'}
            </p>
          )}
          {configured ? (
            <GoogleButton next={safeNext} />
          ) : (
            <p className="faint" style={{ margin: 0, fontSize: 13 }}>
              Đăng nhập đang được thiết lập. Bạn quay lại sau nhé.
            </p>
          )}
          {privateGroup ? (
            <p className="faint" style={{ margin: 0, fontSize: 12 }}>
              Bằng việc tiếp tục, bạn đồng ý với{' '}
              <Link href="/rules" className="muted" style={{ textDecoration: 'underline' }}>
                Quy ước dùng chung
              </Link>{' '}
              của nhóm.
            </p>
          ) : (
            <p className="faint" style={{ margin: 0, fontSize: 12 }}>
              Bằng việc tiếp tục, bạn đồng ý với{' '}
              <Link href="/terms" className="muted" style={{ textDecoration: 'underline' }}>
                Điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link href="/privacy" className="muted" style={{ textDecoration: 'underline' }}>
                Chính sách bảo mật
              </Link>{' '}
              của GAIA.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
