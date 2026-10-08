import Link from 'next/link';
import { Icon, LogoMark } from '@/components/Icon';
import { getUser } from '@/lib/auth.server';
import { getFeaturedModels } from '@/lib/models.server';
import { fmtNumber } from '@/lib/format';

export default async function Home() {
  const [user, models] = await Promise.all([getUser().catch(() => null), getFeaturedModels().catch(() => [])]);
  const startHref = user ? '/studio' : '/login';

  return (
    <div className="home">
      <header className="home-wrap" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link href="/" className="logo" style={{ fontSize: 16 }}>
          <LogoMark size={22} className="mark" />
          GAIA
        </Link>
        <nav aria-label="Điều hướng chính" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          <a href="#model" className="home-nav-link">
            Model
          </a>
          <a href="#cach-hoat-dong" className="home-nav-link">
            Cách hoạt động
          </a>
          <Link href={startHref} className="home-login">
            {user ? 'Vào Studio' : 'Đăng nhập'}
          </Link>
        </nav>
      </header>

      <section className="home-wrap" style={{ paddingTop: 72, paddingBottom: 96, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 56 }}>
        <div style={{ flex: '1 1 460px', minWidth: 0 }}>
          <p className="mono accent" style={{ margin: '0 0 20px', fontSize: 13, letterSpacing: '0.08em' }}>
            ẢNH · VIDEO · CHỈNH SỬA
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 5.2vw, 72px)', lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Ảnh và video AI, trong một studio.
          </h1>
          <p className="muted" style={{ margin: '24px 0 0', maxWidth: 520, fontSize: 18 }}>
            Viết prompt bằng tiếng Việt hoặc tiếng Anh, chọn model, rồi tạo ảnh, sửa ảnh hay dựng video. Tất cả trong cùng một luồng,
            không phải đổi công cụ.
          </p>
          <div style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href={startHref} className="cta">
              Bắt đầu tạo
              <Icon name="arrow-right" size={18} />
            </Link>
            <a href="#cach-hoat-dong" className="cta-ghost">
              Xem cách hoạt động
            </a>
          </div>
        </div>
        <div style={{ flex: '1 1 520px', minWidth: 0, position: 'relative' }} aria-hidden="true">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ aspectRatio: '3 / 4', borderRadius: 12, background: '#3D3129' }} />
              <div style={{ aspectRatio: '1 / 1', borderRadius: 12, background: '#2B3330' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
              <div style={{ aspectRatio: '9 / 16', borderRadius: 12, background: '#263238', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="play-badge" style={{ width: 48, height: 48 }}>
                  <Icon name="play" size={18} />
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ aspectRatio: '1 / 1', borderRadius: 12, background: '#3E3A2B' }} />
              <div style={{ aspectRatio: '3 / 4', borderRadius: 12, background: '#35293A' }} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: '50%', bottom: -28, transform: 'translateX(-50%)', width: 'min(92%, 480px)', background: '#181816', border: '1px solid #2E2E29', borderRadius: 16, padding: '14px 16px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14 }}>Thuyền thúng trôi trên sông lúc hoàng hôn…</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="mono muted" style={{ fontSize: 12 }}>
                VEO 3.1 · 16:9 · 720p · Fast
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--accent)', color: '#1A1206', fontSize: 13, fontWeight: 600 }}>
                Tạo
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="model" style={{ borderTop: '1px solid #262622' }}>
        <div className="home-wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <h2 className="h2">Nhiều model, một chỗ chọn</h2>
          <p className="muted" style={{ margin: '12px 0 0', maxWidth: 560 }}>
            Danh sách model cập nhật trực tiếp theo hệ thống. Mỗi model ghi rõ nó làm được gì và tốn bao nhiêu credit, trước khi bạn bấm
            tạo.
          </p>
          {models.length > 0 ? (
            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {models.map((m) => (
                <article className="model-card" key={m.id}>
                  <span className="mono faint" style={{ fontSize: 12 }}>
                    {m.kind === 'video' ? 'VIDEO' : 'ẢNH'}
                  </span>
                  <h3>{m.name}</h3>
                  <span className="mono muted" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                    {m.tags.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </span>
                  <span className="mono" style={{ marginTop: 'auto', paddingTop: 6, fontSize: 13 }}>
                    từ {fmtNumber(m.fromCredits)} credit
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="faint" style={{ marginTop: 40 }}>
              Danh sách model đang được cập nhật.
            </p>
          )}
        </div>
      </section>

      <section id="cach-hoat-dong" style={{ borderTop: '1px solid #262622' }}>
        <div className="home-wrap" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <h2 className="h2">Cách hoạt động</h2>
          <ol style={{ margin: '40px 0 0', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {[
              ['01', 'Viết prompt', 'Gõ prompt bằng tiếng Việt hoặc tiếng Anh. Prompt video tiếng Việt được tự dịch trước khi gửi.'],
              ['02', 'Chọn model và thông số', 'Ratio, resolution, duration: chỉ hiện những gì model hỗ trợ, kèm giá credit.'],
              ['03', 'Sửa, upscale, tải về', 'Sửa ảnh qua nhiều phiên bản, upscale, tải ảnh và video về máy.'],
            ].map(([n, title, text]) => (
              <li key={n} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="mono accent" style={{ fontSize: 14 }}>
                  {n}
                </span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ borderTop: '1px solid #262622' }}>
        <div className="home-wrap" style={{ paddingTop: 88, paddingBottom: 88, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <h2 className="h2">Bắt đầu với prompt đầu tiên.</h2>
          <Link href={startHref} className="cta">
            {user ? 'Vào Studio' : 'Đăng nhập bằng Google'}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #262622' }}>
        <div className="home-wrap faint" style={{ paddingTop: 28, paddingBottom: 28, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '8px 24px', justifyContent: 'space-between' }}>
          <span>© 2026 GAIA AI</span>
          <span style={{ display: 'flex', gap: 20 }}>
            <Link href="/dieu-khoan" className="faint">
              Điều khoản sử dụng
            </Link>
            <Link href="/bao-mat" className="faint">
              Chính sách bảo mật
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
