import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const ui = Be_Vietnam_Pro({
  variable: '--font-ui',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'GAIA Studio', template: '%s · GAIA Studio' },
  description: 'Tạo ảnh, sửa ảnh và dựng video bằng AI trong một studio. Viết prompt tiếng Việt, chọn model, thấy rõ giá credit trước khi tạo.',
  applicationName: 'GAIA Studio',
};

export const viewport: Viewport = {
  themeColor: '#0F0F0E',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
