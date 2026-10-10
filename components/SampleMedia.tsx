'use client';

import type { Suggestion } from '@/lib/suggestions';

type WithSample = Suggestion & { sample: NonNullable<Suggestion['sample']> };

/**
 * Ảnh/video mẫu thật (tạo bằng GAIA) của một gợi ý.
 * Video chỉ hiện ảnh đại diện và không tải trước; rê chuột vào mới phát (không tiếng, lặp lại).
 * `tapToPlay`: chạm/bấm để phát/dừng (cho máy không có chuột). Không dùng khi video nằm trong một nút khác.
 */
export function SampleMedia({ s, tapToPlay = false }: { s: WithSample; tapToPlay?: boolean }) {
  if (s.kind === 'video') {
    return (
      <video
        src={s.sample.src}
        poster={s.sample.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={s.prompt}
        onMouseEnter={(e) => {
          e.currentTarget.play().catch(() => {});
        }}
        onMouseLeave={(e) => {
          e.currentTarget.pause();
        }}
        onClick={
          tapToPlay
            ? (e) => {
                const v = e.currentTarget;
                if (v.paused) v.play().catch(() => {});
                else v.pause();
              }
            : undefined
        }
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s.sample.src} alt={s.prompt} loading="lazy" />;
}
