import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Icon, LogoMark } from '@/components/Icon';
import { HomePrompt } from '@/components/home/HomePrompt';
import { SampleMedia } from '@/components/SampleMedia';
import { getUser } from '@/lib/auth.server';
import { FEATURED_MODELS, getCatalog } from '@/lib/models.server';
import { hasSample, promptHref, ratioValue, SUGGESTIONS } from '@/lib/suggestions';
import { CREDIT_VALIDITY_DAYS, MIN_TOPUP_VND, VND_PER_CREDIT } from '@/lib/topup-rules';
import { fmtClock, fmtNumber, fmtVnd } from '@/lib/format';
import type { CatalogModel } from '@/lib/types';

// Bảng giá hiện sẵn bao nhiêu dòng; phần còn lại nằm trong "Xem thêm".
const PRICE_ROWS = 8;
// Ý tưởng cạnh khung prompt (vị trí trong SUGGESTIONS).
const EXAMPLE_PROMPTS = [5, 8, 11, 6];

export default async function Home() {
  const [user, catalog] = await Promise.all([
    getUser().catch(() => null),
    getCatalog().catch(() => ({ image: [] as CatalogModel[], video: [] as CatalogModel[] })),
  ]);

  // Model nổi bật lên đầu, rồi đến phần còn lại theo thứ tự trong danh sách chọn model.
  const rank = (m: CatalogModel) => {
    const i = FEATURED_MODELS.indexOf(m.id);
    return i === -1 ? FEATURED_MODELS.length : i;
  };
  const models = [...catalog.video, ...catalog.image].filter((m) => m.available).sort((a, b) => rank(a) - rank(b));
  const lead = models.slice(0, 3).map((m) => m.name);
  const others = models.length - lead.length;
  const samples = SUGGESTIONS.filter(hasSample);
  const examples = EXAMPLE_PROMPTS.map((i) => SUGGESTIONS[i]).filter(Boolean);

  return (
    <div className="home">
      <header className="home-wrap home-header">
        <Link href="/" className="logo" style={{ fontSize: 16 }}>
          <LogoMark size={22} className="mark" />
          GAIA
        </Link>
        <nav aria-label="Điều hướng chính" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          <a href="#models" className="home-nav-link">
            Model và giá
          </a>
          <Link href={user ? '/studio' : '/login'} className="home-login">
            {user ? 'Vào Studio' : 'Đăng nhập'}
          </Link>
        </nav>
      </header>

      <section className="home-wrap home-hero">
        <HomePrompt
          examples={examples.map((s) => ({ kind: s.kind, prompt: s.prompt, thumb: s.sample ? s.sample.poster ?? s.sample.src : undefined }))}
          signedIn={Boolean(user)}
        >
          <h1>Tạo ảnh và video từ một câu mô{' '}tả tiếng{' '}Việt</h1>
          <p className="muted home-lede">
            {lead.length > 0 && (
              <>
                {lead.join(', ')}
                {others > 0 ? ` và ${others} model khác` : ''}.{' '}
              </>
            )}
            Giá credit hiện ngay cạnh nút Tạo, trước khi bạn bấm.
          </p>
        </HomePrompt>
      </section>

      {samples.length > 0 && (
        <section className="home-section">
          <div className="home-wrap">
            <h2 className="h2">Tạo bằng GAIA</h2>
            <p className="muted home-section-lede">
              Mỗi ảnh và video dưới đây được tạo bằng GAIA, từ đúng prompt ghi bên dưới. Rê chuột hoặc chạm vào video để xem.
            </p>
            <div className="sample-grid">
              {samples.map((s) => (
                <article className="card sample-card" key={s.prompt}>
                  <div className="frame">
                    <div className="media" style={{ '--r': ratioValue(s.sample.ratio) } as CSSProperties}>
                      <SampleMedia s={s} tapToPlay />
                    </div>
                    <span className="media-label">
                      {s.kind === 'video' ? 'Video' : 'Ảnh'} · {s.sample.ratio}
                    </span>
                    {s.sample.duration ? <span className="media-label right">{fmtClock(s.sample.duration)}</span> : null}
                  </div>
                  <div className="card-body">
                    <p className="card-title">{s.prompt}</p>
                    <div className="meta-row" style={{ marginTop: 8, alignItems: 'center' }}>
                      <span className="card-meta" style={{ margin: 0 }}>
                        {s.sample.model}
                      </span>
                      <Link href={promptHref(s.kind, s.prompt)} className="link-btn">
                        Dùng prompt này
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="models" className="home-section">
        <div className="home-wrap price-layout">
          <div className="price-intro">
            <h2 className="h2">Model và giá</h2>
            <p className="muted home-section-lede">
              Danh sách lấy trực tiếp từ các model đang chạy. Mỗi ratio, resolution, duration có giá riêng; cột bên phải là mức thấp nhất.
            </p>
            <dl className="facts">
              <div>
                <dt>{fmtNumber(1000)}đ = {fmtNumber(1000 / VND_PER_CREDIT)} credit</dt>
                <dd>Nạp tối thiểu {fmtVnd(MIN_TOPUP_VND)}, quét mã QR bằng app ngân hàng.</dd>
              </div>
              <div>
                <dt>Dùng trong {CREDIT_VALIDITY_DAYS} ngày</dt>
                <dd>Tính từ ngày nạp. Credit sắp hết hạn được dùng trước.</dd>
              </div>
              <div>
                <dt>Lỗi thì hoàn credit</dt>
                <dd>Ảnh hoặc video tạo không thành công được hoàn đủ credit, tự động.</dd>
              </div>
            </dl>
          </div>

          {models.length > 0 ? (
            <div className="price-table">
              <div className="price-row price-head" aria-hidden="true">
                <span>Model</span>
                <span>Làm được</span>
                <span>Giá từ</span>
              </div>
              <ul>
                {models.slice(0, PRICE_ROWS).map((m) => (
                  <PriceRow key={m.id} m={m} />
                ))}
              </ul>
              {models.length > PRICE_ROWS && (
                <details>
                  <summary>
                    Xem thêm {models.length - PRICE_ROWS} model
                    <Icon name="chevron" />
                  </summary>
                  <ul>
                    {models.slice(PRICE_ROWS).map((m) => (
                      <PriceRow key={m.id} m={m} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <p className="faint">Danh sách model đang được cập nhật.</p>
          )}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #262622' }}>
        <div className="home-wrap faint" style={{ paddingTop: 28, paddingBottom: 28, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '8px 24px', justifyContent: 'space-between' }}>
          <span>© 2026 GAIA AI</span>
          <span style={{ display: 'flex', gap: 20 }}>
            <Link href="/terms" className="faint">
              Điều khoản sử dụng
            </Link>
            <Link href="/privacy" className="faint">
              Chính sách bảo mật
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function PriceRow({ m }: { m: CatalogModel }) {
  return (
    <li className="price-row">
      <span className="name">
        {m.name}
        <small>{m.kind === 'video' ? 'Video' : 'Ảnh'}</small>
      </span>
      <span className="tags">
        {m.tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </span>
      <span className="price">
        <Icon name="coin" size={14} />
        {fmtNumber(m.fromCredits)}
      </span>
    </li>
  );
}
