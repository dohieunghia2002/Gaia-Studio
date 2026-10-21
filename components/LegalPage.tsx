import Link from 'next/link';
import { Icon, LogoMark } from './Icon';
import { LEGAL } from '@/lib/legal';

/**
 * Khung cho trang điều khoản/bảo mật. Nội dung lấy thông tin người vận hành từ `lib/legal.ts`.
 * Trang không dùng `lib/legal.ts` (vd. /rules) tự truyền `updatedAt` và `draft`.
 */
export function LegalPage({
  title,
  updatedAt = LEGAL.updatedAt,
  draft = LEGAL.draft,
  children,
}: {
  title: string;
  updatedAt?: string;
  draft?: boolean;
  children: React.ReactNode;
}) {
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
      <main className="prose">
        <h1>{title}</h1>
        <p className="legal-meta">Cập nhật {updatedAt}</p>
        {draft && (
          <p className="legal-draft">Bản nháp. Các mục trong ngoặc vuông chưa được chốt và sẽ được cập nhật trước khi GAIA mở cho người dùng.</p>
        )}
        {children}
      </main>
    </div>
  );
}
