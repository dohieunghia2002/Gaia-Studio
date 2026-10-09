import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Điều khoản sử dụng' };

export default function TermsPage() {
  return (
    <LegalPage title="Điều khoản sử dụng">
      <p>[Nội dung điều khoản sử dụng của GAIA sẽ được cập nhật tại đây.]</p>
    </LegalPage>
  );
}
