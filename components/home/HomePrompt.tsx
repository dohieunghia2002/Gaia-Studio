'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import type { Kind } from '@/lib/types';

// Khung prompt trên trang chủ: gửi đi là mở Studio với prompt điền sẵn (form GET tới /studio).
// Chưa đăng nhập thì proxy chuyển qua /login?next=… nên prompt không bị mất.

export function HomePrompt({
  examples,
  signedIn,
  children,
}: {
  examples: { kind: Kind; prompt: string; thumb?: string }[];
  signedIn: boolean;
  children: ReactNode; // tiêu đề + mô tả của hero, nằm phía trên khung prompt
}) {
  const [kind, setKind] = useState<Kind>('video');
  const [prompt, setPrompt] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const empty = !prompt.trim();

  const pickExample = (ex: { kind: Kind; prompt: string }) => {
    setKind(ex.kind);
    setPrompt(ex.prompt);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  return (
    <div className="hero-grid">
      <div className="hero-main">
        {children}
        <form
          ref={formRef}
          className="composer home-prompt"
          action="/studio"
          method="get"
          onSubmit={(e) => {
            if (empty) e.preventDefault();
          }}
        >
          <input type="hidden" name="kind" value={kind} />
          <label htmlFor="home-prompt" className="sr-only">
            Mô tả ảnh hoặc video bạn muốn tạo
          </label>
          <textarea
            id="home-prompt"
            name="prompt"
            ref={textRef}
            rows={3}
            maxLength={2000}
            placeholder={kind === 'video' ? 'Mô tả video bạn muốn tạo…' : 'Mô tả ảnh bạn muốn tạo…'}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (!empty) formRef.current?.requestSubmit();
              }
            }}
          />
          <div className="row-between">
            <div className="segwrap" role="group" aria-label="Loại nội dung">
              <button type="button" className="seg" aria-pressed={kind === 'image'} onClick={() => setKind('image')}>
                <Icon name="image" />
                Ảnh
              </button>
              <button type="button" className="seg" aria-pressed={kind === 'video'} onClick={() => setKind('video')}>
                <Icon name="video" />
                Video
              </button>
            </div>
            <button type="submit" className="submit" disabled={empty}>
              Tạo
              <Icon name="arrow-right" />
            </button>
          </div>
        </form>
        {!signedIn && <p className="home-prompt-note">Cần đăng nhập Google để tạo. Prompt bạn viết sẽ được giữ lại.</p>}
      </div>
      {examples.length > 0 && (
        <aside className="hero-ideas" aria-labelledby="hero-ideas-title">
          <h2 id="hero-ideas-title">Thử một ý tưởng</h2>
          <ul>
            {examples.map((ex) => (
              <li key={ex.prompt}>
                <button type="button" className="idea" onClick={() => pickExample(ex)}>
                  {ex.thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="idea-thumb" src={ex.thumb} alt="" loading="lazy" />
                  )}
                  <span className="idea-text">
                    <span className="k">
                      <Icon name={ex.kind === 'video' ? 'video' : 'image'} size={14} />
                      {ex.kind === 'video' ? 'Video' : 'Ảnh'}
                    </span>
                    <span className="p">{ex.prompt}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
