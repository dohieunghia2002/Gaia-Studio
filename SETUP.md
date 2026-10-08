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

Lưu ý: upscale ảnh của Gommo trả kết quả trong cùng một request nên có thể chạy lâu. Route này đặt giới hạn 300 giây. Gói Vercel miễn phí có thể giới hạn thời gian chạy ngắn hơn; cần kiểm tra lại khi deploy.

---

## Những điều chưa kiểm chứng

Phải chạy thử có phí mới xác nhận được. Đây chính là lượt chạy thử bạn đã duyệt ngày 06/10.

1. **Định dạng ảnh khung (`images`) và ảnh tham chiếu (`subjects`)** gửi sang Gommo. Tài liệu Gommo không ghi rõ. Code đang gửi `[{ id_base, url }]`; nếu sai thì chỉ cần sửa hàm `toGommoImageRefs` trong `lib/gommo.ts`.
2. **Giá thật Gommo trừ** so với bảng giá `/ai/models`. Bảng giá có chỗ không khớp: VEO 3.1 ghi "từ 600" nhưng dòng rẻ nhất trong bảng là 800. GAIA tính theo dòng khớp nhất của bảng.
3. **Upscale** (`image_resolution`) ứng với model nào (300 hay 500 credit Gommo). Hiện GAIA giữ trước 8 credit (theo mức 500).
4. **Gommo có trả prompt đã dịch không** khi gửi `translate_to_en`. Nếu có, code tự lưu vào `prompt_sent`.
5. Sau khi xác nhận (2) đúng, có thể bật `GAIA_SETTLE_ACTUAL_COST=1` để tự hoàn phần chênh khi giá thật thấp hơn giá đã trừ.

## Tuỳ chỉnh nhanh

- **Ẩn/sắp xếp model, model trên trang chủ**: `HIDDEN_MODELS`, `MODEL_ORDER`, `FEATURED_MODELS` trong `lib/models.server.ts`.
- **Tỉ lệ lời / giá vốn**: `GAIA_MARKUP`, `GAIA_COST_PER_GOMMO_CREDIT` trong `.env`.
- **Mốc nạp, thưởng, hạn dùng**: `lib/topup-rules.ts`. Nếu đổi số ngày hết hạn thì sửa cả `interval '90 days'` trong file SQL.
- **Ý tưởng gợi ý ở Studio lần đầu**: `lib/suggestions.ts`.
- **Điều khoản / Chính sách bảo mật**: `app/dieu-khoan/page.tsx`, `app/bao-mat/page.tsx`. Hiện đang là chỗ trống chờ nội dung.
