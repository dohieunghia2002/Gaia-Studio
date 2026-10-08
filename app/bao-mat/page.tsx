import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Chính sách bảo mật' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Chính sách bảo mật">
      <p>[Nội dung chính sách bảo mật của GAIA sẽ được cập nhật tại đây.]</p>
    </LegalPage>
  );
}
