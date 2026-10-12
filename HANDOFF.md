# Bàn giao GAIA Studio (12/10/2026)

Tài liệu cho người tiếp quản dự án khi chủ dự án vắng mặt. Đọc file này trước, rồi tới [CLAUDE.md](CLAUDE.md).

## GAIA là gì, đang ở đâu

GAIA Studio là web app tạo ảnh và video bằng AI, gõ prompt tiếng Việt. Người dùng đăng nhập Google, mua credit GAIA và tiêu credit để tạo nội dung. Phía sau, GAIA gọi API của **Gommo** qua tài khoản **79ai** của chủ dự án.

**Đã chạy được trên máy (localhost):**
- Đăng nhập Google.
- Tạo ảnh và sửa ảnh (nhiều bản cùng lúc).
- Tạo video từ prompt, Start frame hoặc Start + End frame.
- Thư viện, Thùng rác 30 ngày.
- Ví credit có hạn 90 ngày, tự hoàn credit khi tạo lỗi.
- Trang Credit, trang chủ, giao diện điện thoại.

**Chưa có:**
- Nạp tiền qua PayOS. Code đã viết sẵn nhưng chưa có tài khoản và khoá.
- Bản chạy thật trên mạng (deploy).

## Chạy trên máy trong 10 phút

1. Cài **Node.js 24** và git, rồi `git clone https://github.com/dohieunghia2002/Gaia-Studio.git`. Repo để public nên ai cũng clone được; push bằng tài khoản GitHub của chủ dự án.
2. `npm install`
3. Lấy file **`gaia-studio.env`** trong thư mục bí mật chủ dự án gửi riêng (không có trên GitHub), đặt vào thư mục gốc repo và đổi tên thành **`.env`**. Danh sách biến cần có xem trong [.env.example](.env.example).
4. `npm run dev`, rồi mở http://localhost:3000.

**Lưu ý khi chạy:**
- Đăng nhập Google chỉ chạy ở đúng `http://localhost:3000`, vì Supabase chỉ cho phép quay về địa chỉ này. Muốn dùng địa chỉ khác thì thêm vào **Redirect URLs** của Supabase ([SETUP.md](SETUP.md), bước 4).
- **Không chạy `npm run build` khi `npm run dev` đang chạy.** Hai lệnh dùng chung thư mục `.next`; build chen ngang sẽ làm mọi trang báo 404. Nếu đã lỡ: tắt dev, xoá thư mục `.next`, chạy lại `npm run dev`.
- Lần đầu mở mỗi trang sau khi bật dev sẽ chậm vài giây vì phải biên dịch.
- Ví test của chủ dự án (dhnghia.ctu@gmail.com) còn khoảng 278 credit. Cấp thêm credit test bằng SQL trong Supabase: `select gaia_grant((select id from auth.users where email = '...'), 500, 'Credit dùng thử');`
- **Mỗi lần bấm Tạo là tiêu tiền thật** ở tài khoản 79ai.

## Bắt đầu với Claude Code

Mở Claude Code trong thư mục repo và dán nguyên đoạn dưới đây. **Không cần chạy `/init`**: Claude Code tự đọc [CLAUDE.md](CLAUDE.md) có sẵn, còn `/init` có thể ghi đè file này.

```text
Mình là đồng nghiệp tiếp quản dự án GAIA Studio từ chủ dự án (Đỗ Hiếu Nghĩa), người đã tạm dừng làm việc từ 12/10/2026. Hãy tìm hiểu toàn bộ dự án trước khi làm bất cứ việc gì:

1. Đọc theo thứ tự: HANDOFF.md, CLAUDE.md, AGENTS.md, SETUP.md, docs/gommo-api.md, rồi docs/claude-memory/MEMORY.md và các file nó liệt kê. Đó là ghi chú của trợ lý AI trước; ngày trong ghi chú là ngày xảy ra sự việc, thông tin mới nhất nằm ở HANDOFF.md. Lướt docs/qa/ để biết những gì đã kiểm thử.
2. Kiểm tra máy mình, không gọi API nào tốn tiền: đã có file .env chưa (lấy từ thư mục bí mật, xem HANDOFF.md), rồi chạy npm install, npm run typecheck, npm run lint.
3. Tóm tắt lại cho mình bằng tiếng Việt: sản phẩm là gì, kiến trúc chính, trạng thái hiện tại, các việc còn dở theo thứ tự ưu tiên, và những điều bạn chưa rõ cần hỏi mình.
4. Lưu những điều cần nhớ lâu dài vào memory của bạn: quy ước giao diện, những điều đã kiểm chứng về Gommo, và các quy tắc dưới đây. Sở thích cá nhân trong ghi chú cũ là của chủ dự án, không phải của mình; cần thì hỏi mình.

Quy tắc bắt buộc:
- KHÔNG gọi API tạo ảnh/video của Gommo, cũng không bấm Tạo trong app, khi mình chưa đồng ý rõ ràng. Mỗi lần là tiền thật.
- Repo đang PUBLIC: không bao giờ commit .env, file client_secret hay bất kỳ khoá nào; quét diff trước mỗi lần push.
- Không chạy npm run build khi npm run dev đang chạy (hỏng thư mục .next, mọi trang báo 404).
- Next.js 16 khác với kiến thức cũ của bạn: đọc tài liệu trong node_modules/next/dist/docs trước khi viết code Next.
- Chữ trên giao diện bằng tiếng Việt theo docs/claude-memory/gaia-ux-conventions.md; không hứa điều Gommo chưa hỗ trợ (docs/claude-memory/verify-gommo-before-ui-claims.md); đổi thiết kế thì sửa cả mockup trong design/mockup-gaia.

Ở bước này chưa sửa code: chỉ đọc, kiểm tra rồi báo lại cho mình.
```

## Tài khoản dùng cho dự án

Chủ dự án cho phép người tiếp quản dùng trực tiếp mọi tài khoản của mình; không cần mời hay xin quyền riêng.

| Dịch vụ | Để làm gì |
|---|---|
| GitHub `dohieunghia2002` (repo `Gaia-Studio`) | Đẩy code |
| Supabase project `ynifiicggklbnszvjjkb` | Database, đăng nhập, xem log, chạy SQL |
| Google Cloud (OAuth client của GAIA) | Sửa cấu hình đăng nhập Google, thêm tên miền khi deploy |
| Tài khoản 79ai / Gommo | Xem số dư và lịch sử trừ tiền thật |
| PayOS (khi làm) | Tạo kênh thanh toán, lấy 3 khoá |

Các khoá bí mật (`.env`, Google client secret) chỉ có trong thư mục bí mật gửi riêng, kèm file `DOC-TRUOC.txt` hướng dẫn và cách đổi khoá nếu lộ.

## Tài liệu trong repo

| File / thư mục | Nội dung |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Kiến trúc code và các quyết định kỹ thuật, **đọc đầu tiên** (tiếng Anh) |
| [SETUP.md](SETUP.md) | Cài Supabase, Google, PayOS từ đầu; các bước deploy |
| [docs/gommo-api.md](docs/gommo-api.md) | Tài liệu API Gommo và những điều đã kiểm chứng |
| [docs/qa/](docs/qa/) | Kết quả kiểm thử vòng 1 (tạo ảnh) và vòng 2 (hệ thống), xuất từ bảng trên claude.ai |
| [design/mockup-gaia/](design/mockup-gaia/) | Mockup chuẩn: mở `GAIA-Studio-mockup.html` bằng trình duyệt; 7 màn hình (`#studio`, `#empty`, `#edit`, `#video`, `#home`, `#auth`, `#credit`). Giao diện app được dựng theo file này |
| [design/logo/](design/logo/) | Logo: `final/gaia-mark.svg` là bản gốc; các ảnh `untitled_*` là bản phác thảo |
| [docs/claude-memory/](docs/claude-memory/) | Ghi chú làm việc của Claude (trợ lý AI viết code): quyết định sản phẩm, quy ước giao diện, điều đã kiểm chứng về Gommo, giá vốn. File `MEMORY.md` là mục lục |

## Quy ước sản phẩm cần giữ

- Chữ trên giao diện bằng tiếng Việt. Thuật ngữ creator giữ tiếng Anh: frame, text-to-video, reference, upscale…
- Không đưa lên giao diện tính năng, ước tính thời gian hay lời hứa nào mà Gommo chưa thật sự hỗ trợ.
- Nút nào tốn credit cũng hiện giá ngay cạnh nút. Tạo lỗi thì hoàn credit và ghi rõ "Đã hoàn X credit".
- Không nhắc tên Gommo hay 79ai trên giao diện.
- Thư viện dạng lưới đều ô (không masonry); ảnh luôn hiển thị trọn khung, không cắt.
- Đổi thiết kế thì sửa cả mockup ([design/mockup-gaia](design/mockup-gaia/)) lẫn app cho khớp.

Chi tiết: [docs/claude-memory/gaia-ux-conventions.md](docs/claude-memory/gaia-ux-conventions.md).

## Việc còn dở, theo thứ tự nên làm

1. **Kiểm thử H01** (tắt Wi-Fi để giả lập mất kết nối máy chủ đăng nhập), case duy nhất vòng 2 chưa test. Xem [docs/qa/vong-2-he-thong.md](docs/qa/vong-2-he-thong.md).
2. **PayOS:** đăng ký, điền 3 khoá vào `.env` ([SETUP.md](SETUP.md), bước 6). Webhook cần địa chỉ công khai nên đi cùng việc deploy.
3. **Deploy:** nên đặt server ở Singapore, cùng vùng với database Supabase (ap-southeast-1); khi chạy trên máy ở VN mỗi lần gọi Supabase mất khoảng 250 ms. Thêm tên miền vào Supabase, Google và PayOS ([SETUP.md](SETUP.md), bước 7).
4. **Điều khoản sử dụng và Chính sách bảo mật** đang là nội dung tạm, cần nội dung thật trước khi mở cho người dùng.
5. **Mockup chưa cập nhật** chip ảnh khung mới: chữ "đã cắt 16:9" và khung xem trước khi bấm vào hình thu nhỏ.
6. **Trên điện thoại**, khung tạo nội dung chiếm khá nhiều chiều cao màn hình.
7. **Supabase đang ở gói miễn phí (Nano)**, từng báo "Unhealthy" ngày 11/10. Cân nhắc gói Pro trước khi có người dùng trả tiền.
8. `npm audit` còn 5 cảnh báo, đều trong `eslint-config-next` (công cụ lint, không chạy trong app). Cách "sửa" npm gợi ý là hạ phiên bản xuống 14, không nên làm.

## Những điều về Gommo đã học được (dễ vấp)

- **Cờ khả năng của model không đáng tin.** Ví dụ: Kling 2.5 báo tạo được từ prompt thuần nhưng thực tế bắt buộc có Start frame; Start + End frame của Kling 2.5 chỉ chạy ở Mode Professional. GAIA xử lý bằng `START_FRAME_REQUIRED` và `END_FRAME_MODES` trong `lib/models.server.ts`. Gặp model nào tương tự thì thêm vào đó.
- **Video Veo đôi khi bị Google chặn** (`#vid_policy`), kể cả khi cùng ảnh và prompt lần sau lại chạy được. Gommo tự hoàn tiền, GAIA tự hoàn credit, nên vẫn để nút Thử lại.
- Ảnh khung khác tỉ lệ video sẽ bị chèn viền đen, nên GAIA tự cắt ảnh khung trên trình duyệt.
- Kiểm tra số tiền thật đã bị trừ (miễn phí): `POST /api/apps/go-mmo/users/paymentsHistory` với `currency_name=credits_ai`.

## Liên kết chỉ chủ dự án mở được

Các trang trên claude.ai dưới đây là riêng tư; nội dung chính đã được sao vào repo:
- Bảng kiểm thử vòng 1: https://claude.ai/artifact/6V1FGJZQBgn2RN9gkKzyTo → [docs/qa/vong-1-tao-anh.md](docs/qa/vong-1-tao-anh.md)
- Bảng kiểm thử vòng 2: https://claude.ai/artifact/GLEQL5BL9Px7gobtFFwvng → [docs/qa/vong-2-he-thong.md](docs/qa/vong-2-he-thong.md)
- Canvas thiết kế: https://claude.ai/artifact/EfF6h7iJ78JWFomq9kgZ2m → bản tương đương là [design/mockup-gaia](design/mockup-gaia/)

Ở vòng 1 còn 2 dòng "Lỗi" (D02 nút "Lấp đầy", E04 Upscale). Cả hai đã được xử lý ngày 11/10 bằng cách gỡ hai tính năng đó.
