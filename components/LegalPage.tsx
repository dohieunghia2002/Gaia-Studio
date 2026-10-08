import Link from 'next/link';
import { Icon, LogoMark } from './Icon';

/** Khung cho trang điều khoản/bảo mật. Nội dung pháp lý do GAIA tự soạn (chưa có). */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
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
        {children}
      </main>
    </div>
  );
}
