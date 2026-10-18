# Cài đặt GAIA Studio

Code đã viết xong cho cả 7 màn: trang chủ, đăng nhập Google, Studio, chi tiết ảnh, chi tiết video, Credit & nạp tiền. Để chạy thật, cần 3 thứ mà chỉ chủ tài khoản làm được: **Supabase** (đăng nhập + cơ sở dữ liệu), **Google OAuth** (nút "Tiếp tục với Google") và **PayOS** (nạp tiền). Làm theo thứ tự dưới đây.

Mỗi bước ghi rõ cần lấy gì và dán vào đâu. Tên menu trên dashboard của Supabase/Google/PayOS có thể hơi khác tuỳ thời điểm.

---

## Bước 1 — Tạo project Supabase mới

Project Supabase cũ trong `.env` đã chết (tên miền không còn tồn tại, kiểm tra ngày 08/10/2026), nên phải tạo project mới.

1. Vào https://supabase.com/dashboard → **New project**. Gói Free là đủ để chạy thử.
2. Region: chọn **Southeast Asia (Singapore)** cho gần Việt Nam.
3. Đặt mật khẩu database và lưu lại (GAIA không dùng trực tiếp mật khẩu này, nhưng cần khi quản trị).

## Bước 2 — Tạo bảng và hàm credit

1. Trong project → **SQL Editor** → **New query**.
2. Mở file `supabase/migrations/0001_gaia_init.sql`, sao chép **toàn bộ**, dán vào rồi bấm **Run**.
3. Thấy "Success" là xong. File này tạo bảng thư viện, ví credit (lô 90 ngày, tiêu lô cũ trước), lịch sử giao dịch, đơn nạp tiền, và chặn người dùng tự cộng credit.

> File SQL này đã chạy thử trên Postgres với 34 kiểm thử: trừ, hoàn, hết hạn, nạp tiền, quyền truy cập. Tất cả đều qua.

## Bước 3 — Lấy khoá Supabase điền vào `.env`

Trong project → **Project Settings → API Keys** (và **Data API** để lấy URL):

| Trên dashboard | Dán vào `.env` |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key (`sb_secret_…`) | `SUPABASE_SECRET_KEY` |

**Secret key tuyệt đối không chia sẻ**: ai có khoá này là đọc/ghi được toàn bộ dữ liệu. Nếu project chỉ có khoá kiểu cũ (`anon` / `service_role`) thì dùng `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`; code nhận cả hai kiểu.

Xem mẫu đầy đủ ở `.env.example`.

## Bước 4 — Bật đăng nhập Google

Hướng dẫn gốc của Supabase: https://supabase.com/docs/guides/auth/social-login/auth-google

1. Vào https://console.cloud.google.com → tạo project (vd "GAIA").
2. **APIs & Services → OAuth consent screen**: điền tên app "GAIA", email hỗ trợ, chọn External.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, loại **Web application**:
   - **Authorized redirect URIs**: `https://<mã-project>.supabase.co/auth/v1/callback`. Mã project nằm trong Project URL ở bước 3.
4. Copy **Client ID** và **Client secret**.
5. Quay lại Supabase → **Authentication → Sign In / Providers → Google** → bật, dán Client ID và Client secret → Save.
6. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (khi có tên miền thật thì đổi thành tên miền đó).
   - **Redirect URLs**: thêm `http://localhost:3000/auth/callback`, sau này thêm `https://<tên-miền>/auth/callback`.

## Bước 5 — Chạy thử trên máy

```bash
cd gaia-studio
npm install
npm run dev
```

Mở http://localhost:3000 → **Đăng nhập** → chọn tài khoản Google. Lần đầu đăng nhập, GAIA tự tạo tài khoản với số dư 0 credit.

**Tặng credit cho chính mình để thử tạo ảnh/video** (khi chưa có PayOS): vào Supabase → SQL Editor, chạy:

```sql
select gaia_grant((select id from auth.users where email = 'email-cua-ban@gmail.com'), 500, 'Credit dùng thử');
```

> Mỗi lần bấm **Tạo** là gọi Gommo thật và **tốn credit thật** trên tài khoản 79ai.

## Bước 6 — Bật nạp tiền PayOS

1. Đăng ký tại https://payos.vn, xác minh tài khoản (cá nhân dùng CCCD).
2. Tạo **kênh thanh toán**, liên kết tài khoản ngân hàng nhận tiền.
3. Trong kênh thanh toán, lấy 3 khoá điền vào `.env`: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
4. **Webhook URL** (cần tên miền công khai, tức là sau khi deploy): `https://<tên-miền>/api/payos/webhook`.

Khi chạy trên máy (chưa có webhook), trang Credit tự hỏi PayOS mỗi 3 giây trong lúc chờ chuyển khoản. Vì vậy credit vẫn được cộng ngay khi tiền về. Webhook là đường thứ hai, phòng khi người dùng đã đóng trang. Credit chỉ được cộng một lần dù cả hai đường cùng báo.

## Bước 7 — Đưa lên mạng (khi sẵn sàng)

Gợi ý Vercel (hợp với Next.js):

1. Đưa thư mục `gaia-studio` lên GitHub (file `.env` đã nằm trong `.gitignore`, không bị đẩy lên).
2. Import vào Vercel, khai báo các biến môi trường giống `.env`, đặt `NEXT_PUBLIC_SITE_URL` = tên miền thật.
3. Thêm tên miền thật vào **Redirect URLs** của Supabase (bước 4) và **Webhook URL** của PayOS (bước 6).

---

## Đã kiểm chứng (10/10/2026)

Lượt tạo 9 ảnh/video mẫu cho trang chủ (5 ảnh Nano Banana 2 1k, 4 video VEO 3.1 Fast 720p 8s, gọi thẳng Gommo, không qua ví GAIA):

- **Giá thật Gommo trừ đúng bằng bảng giá** `/ai/models` và bằng `credit`/`credit_fee` Gommo trả về: số dư 191.600 → 184.800, trừ đúng 6.800 = 5 × 400 + 4 × 1.200. Vì vậy bật `GAIA_SETTLE_ACTUAL_COST=1` là an toàn (hiện chưa bật).
- **Gommo không trả prompt đã dịch** khi gửi `translate_to_en`: cả lúc gửi lẫn lúc xong, `prompt` vẫn là câu tiếng Việt gốc. `prompt_sent` vì thế sẽ để trống.
- Thời gian: ảnh xong sau khoảng 35–75 giây, video VEO 3.1 Fast sau khoảng 2,5–3 phút.

Lượt bạn kiểm thử trong app (11/10/2026) xác nhận thêm:

- Ảnh tham chiếu (`subjects`) gửi đúng định dạng: model dùng đúng người/đồ vật trong ảnh.
- Đóng tab trong lúc đang tạo thì ảnh vẫn tạo xong.
- Sửa ảnh tốn bằng tạo ảnh (Nano Banana 2 1K = 400 credit Gommo).

**Upscale đã gỡ khỏi GAIA (11/10/2026).** Công cụ upscale của Gommo báo lỗi "Upload ảnh thất bại (HTTP 401)" và một lần còn trừ 200 credit mà không trả ảnh. Sau này GAIA sẽ tự làm tính năng này.

## Những điều chưa kiểm chứng

1. **Ảnh khung (Start/End frame) của video** gửi sang Gommo. Code dùng chung định dạng với ảnh tham chiếu (đã chạy đúng), nhưng chưa thử với video. Nếu sai thì sửa hàm `toGommoImageRefs` trong `lib/gommo.ts`.

## Tuỳ chỉnh nhanh

- **Model được bán, sắp xếp model, model trên trang chủ**: `VERIFIED_MODELS` (danh sách trắng: chỉ model và chức năng đã kiểm thử mới hiện), `MODEL_ORDER`, `FEATURED_MODELS` trong `lib/models.server.ts`.
- **Tỉ lệ lời / giá vốn**: `GAIA_MARKUP`, `GAIA_COST_PER_GOMMO_CREDIT` trong `.env`.
- **Mốc nạp, thưởng, hạn dùng**: `lib/topup-rules.ts`. Nếu đổi số ngày hết hạn thì sửa cả `interval '90 days'` trong file SQL.
- **Ý tưởng gợi ý** (Studio lần đầu và cột "Thử một ý tưởng" ở trang chủ): `lib/suggestions.ts`.
- **Ảnh/video mẫu**: đặt file vào `public/samples/` rồi điền `sample` cho đúng gợi ý trong `lib/suggestions.ts`. Chỉ dùng kết quả thật tạo bằng GAIA từ đúng prompt đó. Có mẫu thì thẻ gợi ý hiện ảnh, và trang chủ tự hiện mục "Tạo bằng GAIA".
- **Điều khoản / Chính sách bảo mật**: `app/terms/page.tsx`, `app/privacy/page.tsx`. Hiện đang là chỗ trống chờ nội dung.
