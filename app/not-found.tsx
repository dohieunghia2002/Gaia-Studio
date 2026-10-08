import Link from 'next/link';
import { LogoMark } from '@/components/Icon';

export default function NotFound() {
  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <LogoMark size={40} />
      <h1 style={{ margin: 0, fontSize: 22 }}>Không tìm thấy trang này</h1>
      <p className="muted" style={{ margin: 0 }}>
        Có thể mục này đã bị xoá khỏi thư viện, hoặc đường dẫn không đúng.
      </p>
      <Link href="/studio" className="primary" style={{ width: 'auto', height: 44, padding: '0 20px' }}>
        Về Studio
      </Link>
    </div>
  );
}
