# Gommo AI API — tài liệu tham khảo

Nguồn: prompt tài liệu do Gommo cung cấp, được cô đọng lại (đủ mọi endpoint và tham số, rút gọn ví dụ JSON). Các mục ghi **đã kiểm chứng** là kết quả gọi thử API thật ngày 2026-10-05.

## Quy ước chung

- Base URL `https://api.gommo.net`. Mọi endpoint đều dùng `POST`, body `application/x-www-form-urlencoded`.
- Mọi request đều kèm `access_token` (lấy tại `https://{GOMMO_DOMAIN}/pages/account/apikeys`) và `domain`. Trong code, `gommoPost` ở `lib/gommo.ts` tự thêm hai trường này.
- Tham số kiểu array/object (`images`, `subjects`) gửi dưới dạng chuỗi JSON (`gommoPost` đã làm việc này).
- Lỗi trả về trong body dạng `{ "error": 1 | "<code>", "message": "..." }`, nên phải kiểm tra body chứ không chỉ HTTP status.
- `ratio`, `resolution`, `duration`, `mode` chỉ áp dụng cho model có hỗ trợ; xem `/ai/models` trước khi gửi.

## Chỗ tài liệu gốc sai so với API thật (đã kiểm chứng)

- `/ai/image` trả về `{ imageInfo: {...}, runtime }`, **không** đặt các trường ở cấp ngoài cùng như ví dụ trong tài liệu gốc. `imageInfo` có thêm `credit`, `message`, `ratio`, `url_thumb`, `url_preview`.
- `/ai/video` trả về `{ videoInfo: {...} }`, có thêm `credit_fee`, `message`, `thumbnail_end_url`, `modelInfo`.
- Tài liệu không nói phần tử của `images` (create-video) và `subjects` (generateImage) có dạng gì. Tài khoản hiện chưa có job nào dùng hai tham số này để đối chiếu.

## Lượt tạo có phí đầu tiên (2026-10-10)

9 job (5 × Nano Banana 2 `vip` 1k `16_9`, 4 × VEO 3.1 `fast` 720p 8s `16:9` với `translate_to_en=true`):

- `imageInfo.credit` (400) và `videoInfo.credit_fee` (1.200) có ngay trong phản hồi lúc gửi, và bằng đúng số bị trừ: `/api/apps/go-mmo/ai/me` → `balancesInfo.credits_ai` giảm 6.800 = tổng giá niêm yết.
- `videoInfo.prompt` lúc gửi và lúc xong đều là prompt tiếng Việt gốc, không phải bản đã dịch.
- Nano Banana 2 1k `16_9` trả PNG 1376×768 (~2 MB). `url_thumb` của ảnh là JPEG nhỏ. Video MP4 720p 8s nặng 3–11 MB, có `thumbnail_url` (JPEG).
- Ảnh xong sau khoảng 35–75 giây; video sau khoảng 2,5–3 phút (hỏi trạng thái mỗi 10 giây). Không job nào lỗi.

## Quan sát thêm khi gọi thử (2026-10-08, chỉ các lệnh đọc, không tốn credit)

- `/ai/images`: `url` có đuôi `?full=1`; `url_preview` là ảnh gốc; `url_thumb` là ảnh CDN đã thu nhỏ còn 480px (`/cdn-cgi/image/width=480,…`), hợp để làm thẻ thư viện.
- `/ai/models`:
  - `status` có thể là `ON`, `maintenance` hoặc không có trường này.
  - Một số model có `notices` (cảnh báo, mẹo) và `configs.reference.limits`, cùng `rate_type` là `per_unit` hoặc `per_second`.
  - Ảnh có `withSubject`/`maxSubject`. Video có thêm `withEdit`, `withUpscale`, `withMultiShots`.
  - Trong `prices`, `duration` có thể là số hoặc chuỗi.
  - Một số tổ hợp không có trong bảng, nghĩa là model không bán tổ hợp đó (vd Hailuo 2.3 không có Relax 1080p).
  - `price` ở cấp model có thể thấp hơn dòng rẻ nhất của `prices`: VEO 3.1 ghi 600, nhưng rẻ nhất trong bảng là lite 720p = 800.
- Gợi ý prompt (`ai_templates/tools`): `midjourney_feed_suggested` trả `items: null`, `kling_feed_suggested` trả rỗng, `sora_feed_suggested` báo "Hiện gói dịch vụ không khả dụng". Số dư không đổi sau các lệnh này.

## Kiểm thử chức năng phụ (18/10/2026, đã kiểm chứng, xem `docs/qa/`)

- **Status `SUCCESS` không có nghĩa là model đã dùng ảnh gửi kèm.**
  - Sửa ảnh (`editImage=true` + `base64Image`) trên Z-Image, Kling Colors 1.5 và 2.1 vẫn thành công và trừ tiền, nhưng ra một ảnh mới hoàn toàn, bỏ qua ảnh gốc.
  - Wan 3.0 (mode `cheap` và `vip`): Gommo ghi đúng `action_type: createFromImageStart(AndEnd)` và giữ đúng `images`, nhưng video ra một cảnh khác.
  - Meta Muse: Start frame đúng 2/3 lần; End frame sai 2/2 lần (lần 2 sai cả khung đầu).
- `subjects` gồm 3 ảnh `[{id_base, url}]` chạy đúng (ảnh ra có đủ cả 3 vật thể) trên Nano Banana 2/Pro, Nano Banana, GPT Image 2, GPT Image 2.5 Flare/Sunburst, Kling 3.0 Omni (ảnh), O1 và Kling Colors 2.0.
- Kling 2.1 (5s, 10s) với Start frame: "Tạo video thất bại, có thể nội dung vi phạm chính sách, hoặc File ảnh, Video chất lượng quá thấp #54hh".
  - Lỗi xảy ra ở cả Standard lẫn Professional, với ảnh 960×540 lẫn 2752×1536 phong cảnh không người, nên không phải do độ phân giải.
  - Start + End ở Standard bị báo lỗi sau ~2 phút (không phải từ chối ngay): "chỉ hỗ trợ End Frame ở Professional".
- Midjourney 7.0/8.1/8.2 vẫn "Không thể hoàn thành #csdsd2" với prompt tiếng Anh, nên lỗi không do ngôn ngữ.
- Lỗi mới: `#img_bp` "Máy chủ tạo ảnh không khả dụng" (Seedream 5.0 Pro/Flash, mọi lượt, kể cả tạo ảnh từ prompt); Hailuo 2.3 báo "gói dịch vụ không khả dụng"; Veo Omni + Start frame báo `#vid_fail` 2/2 lần.
- Reference cho video: `/ai/models` báo `withReference: true` cho 16 model video, và `configs.reference.inputSpec` gợi ý trường multipart `video_files[]`/`audio_files[]`. Tài liệu không mô tả cách gửi, nên GAIA chưa dùng.

## Ảnh

### Tạo ảnh / sửa ảnh — `/ai/generateImage`

| Tham số | Ghi chú |
|---|---|
| `action_type` | bắt buộc, `create` |
| `model` | bắt buộc, lấy từ `/ai/models?type=image` |
| `prompt` | bắt buộc, mô tả để tạo hoặc sửa ảnh |
| `editImage` | `true` \| `false`; `true` là sửa ảnh, khi đó cần `base64Image` |
| `base64Image` | base64 **có** tiền tố, vd `data:image/jpeg;base64,xxxx` |
| `subjects` | array; đối tượng để model tham chiếu |
| `ratio` | `9_16` \| `16_9` \| `1_1` |
| `project_id` | mặc định `default` |

Tài liệu không liệt kê `mode`/`resolution` cho ảnh, nhưng code hiện có gửi.

Phản hồi: `{ success: true, imageInfo: { id_base, status: "PENDING_ACTIVE", prompt, url: null } }`. Sau đó poll `/ai/image`.

### Trạng thái ảnh — `/ai/image`

Tham số: `id_base`. Các status: `PENDING_ACTIVE` (đã nhận, chờ xử lý), `PENDING_PROCESSING` (đang render), `SUCCESS` (có `url`), `ERROR`. Không tìm thấy: `{ message, error: "not_found" }`.

### Danh sách ảnh — `/ai/images`

Tham số: `project_id` (mặc định `default`), `category`, `source`, `project_password`. Phản hồi: `{ data: [{ id_base, project_id, url, url_thumb, prompt, model, ratio, status, created_at, ... }] }`.

### Upload ảnh — `/ai/image-upload`

Tham số: `data` (base64 **không** có tiền tố `data:image/...;base64,`), `project_id`, `file_name`, `size`. Phản hồi: `{ success, imageInfo: { id_base, status: "SUCCESS", url } }`. Ảnh dùng cho tham số `images` của create-video phải được upload qua đây.

### Upscale ảnh — `/api/apps/go-mmo/ai_templates/tools` (GAIA đã gỡ 2026-10-11)

**Lỗi phía Gommo (2026-10-11):** gửi `url` ảnh công khai trên `ai-cdn.gommo.net` (tải được, HTTP 200) vẫn nhận `{ error, message: "Upload ảnh thất bại (HTTP 401)" }`. Lần đầu Gommo vẫn trừ 200 credit ("Upscale Image with AI Credit [4K]") mà không có ảnh trong `/ai/images`; lần thứ hai không trừ. Giá thật của upscale là 200, không phải 300/500.

Tham số: `id_base` = `image_resolution` (cố định), `url` (ảnh cần upscale), `project_id`. Trả kết quả ngay, không cần poll: `{ success, imageInfo: { id_base, status, model: "upscale", url, credit }, balancesInfo: { credits_ai } }`.

## Video

### Tạo video — `/ai/create-video`

| Tham số | Ghi chú |
|---|---|
| `model` | bắt buộc, vd `veo_3_fast` |
| `privacy` | bắt buộc, `PRIVATE` \| `PUBLIC` |
| `prompt` | bắt buộc. **Model Google Veo không hỗ trợ tiếng Việt** |
| `translate_to_en` | `true` \| `false`; `true` thì hệ thống tự dịch prompt sang tiếng Anh |
| `ratio`, `resolution`, `duration`, `mode` | bắt buộc nếu model hỗ trợ (vd `16:9`, `720p`, `6`, `fast`) |
| `images` | array. Rỗng = tạo từ text; 1 ảnh = first frame; 2 ảnh = first + end frame. Ảnh phải upload qua `/ai/image-upload` |
| `project_id` | mặc định `default` |

Phản hồi: `{ message, videoInfo: { id_base, task_id, status: "MEDIA_GENERATION_STATUS_PENDING", credit_fee, prompt } }`.

### Trạng thái video — `/ai/video`

Tham số: `videoId` (= `videoInfo.id_base`). Các status:

- `MEDIA_GENERATION_STATUS_PENDING`: vừa gửi, chờ xử lý
- `MEDIA_GENERATION_STATUS_ACTIVE`: đang kích hoạt
- `MEDIA_GENERATION_STATUS_PROCESSING`: đang render
- `MEDIA_GENERATION_STATUS_SUCCESSFUL`: thành công
- `MEDIA_GENERATION_STATUS_FAILED`: thất bại
- `ERROR`: không có trong tài liệu nhưng Gommo dùng thật cho video lỗi (`#vid_policy`, `#vid_fail`, `#vid_maintenance`, `#cg33`…).
- **Status khác KHÔNG phải lỗi** (sửa 17/10/2026). Seedance 2.0 Pro từng trả một status lạ kèm "Đang chuyển máy chủ xử lý..." rồi vẫn thành công và đã trừ tiền. GAIA coi status lạ là đang chạy, chỉ chốt lỗi khi `FAILED`/`ERROR` kéo dài ít nhất 60 giây; còn lại để timeout xử lý.

`download_url` có thể xuất hiện chậm vài giây sau khi status đã là `SUCCESSFUL`, nên cần poll thêm vài lần. Có thêm `thumbnail_url`.

### Danh sách video — `/ai/videos`

Tham số: `project_id` (mặc định: tất cả), `after_id` (phân trang), `project_password`, `limit`, `order_by`, `sort_by`. Phản hồi: `{ data: [{ id_base, status, prompt, download_url, thumbnail_url, created_time, author: { name, id_base } }] }`.

### Upload video — `/ai/video-upload`

Tham số: `data` (base64 không có tiền tố `data:video/...;base64,`), `project_id`, `file_name`, `size`. Phản hồi: `{ success, videoInfo: { id_base, status: "SUCCESS", url } }`.

## Model — `/ai/models`

Tham số: `type` = `image` | `video` | `tts`. Phản hồi: `{ data: [Model] }`. Các trường của một model:

- `id_base`, `name`, `description`, `server` (vd `google_veo`, `wanai`, `xai`, `elevenlabs`), `model` (giá trị gửi vào tham số `model`)
- `ratios`, `resolutions`, `durations`: `[{ name, type }]`; gửi giá trị `type`
- `mode`: `[{ type, name, description, price }]` (code cũng đọc `modes` để phòng trường hợp khác tên)
- `prices`: `[{ mode?, resolution?, duration?, price }]`; `price` là giá thấp nhất; `price_note` (TTS: "per 1000 characters")
- Cờ khả năng: `startText`, `startImage`, `startImageAndEnd`, `withReference`, `extendVideo`, `withLipsync`, `withMotion`
- Giới hạn theo ngày (một số model, vd Veo): `videoTotalToday`, `videoMaxToday`

## Audio (TTS) — đều gọi `/ai/audio`, phân biệt bằng `action_type`

Tài liệu gốc chỉ ghi giá trị `action_type` cho thao tác tìm giọng (`searchVoices`); các thao tác còn lại chưa rõ giá trị.

- **Danh sách giọng**: `project_id`, `filters[privacy]`, `filters[type]`, `filters[price]`, `filters[explore]` → `{ data: { items: [{ id_base, name, status, voice_id, preview_url, server, type, price }], pagination } }`
- **Tìm giọng** (`action_type=searchVoices`): `server` (`elevenlabs` \| `minimaxai`), `type` (`system` \| `design` \| `clone`), `limit`, `page`. Giọng có `status: "DIE"` thì không dùng được.
- **Danh sách audio**: `project_id`, `prompt_id`, `filters[...]` → `{ data: [{ id_base, text, status, duration, file_url, server, price, created_at }] }`
- **Tạo audio**: `text`, `voice_id` (bắt buộc); `voice_settings[speed]`, `voice_settings[stability]`, `voice_settings[similarity_boost]`, `voice_settings[style]`, `voice_settings[use_speaker_boost]`, `model` (`eleven_v3` \| `eleven_flash_v2_5`), `seed`, `prompt_id`, `project_id` → trả ngay `{ audioInfo: { id_base, status, duration, file_url, price, model, ... }, balancesInfo }`
- **Thiết kế giọng, bước 1 (preview)**: `prompt`, `name`, `text_preview`, `voice_index=-1` (bắt buộc); `description`, `seed`, `project_id` → `{ account_id, previews: [{ audio_base_64, generated_voice_id, media_type }] }`
- **Thiết kế giọng, bước 2 (lưu)**: gửi lại đúng `prompt`, `name`, `text_preview`, `seed` của bước 1; thêm `account_id` (từ bước 1), `voice_id` (= `generated_voice_id` đã chọn), `voice_index` (vị trí preview đã chọn, vd `0`), `project_id` → `{ voiceInfo: { id_base, name, voice_id, preview_url, ... } }`

## Nhạc

- **Tạo nhạc** `/api/apps/go-mmo/ai_musics/create`: `name` (bắt buộc), `prompt` (lời hoặc mô tả; để trống = nhạc không lời), `gender` (`m` \| `f`; trống = ngẫu nhiên), `mode`, `model` (`vsky-v2.5` \| `vsky-v2.0` \| `suno-v4.5`), `styles`, `project_id`. Trả về **2 phiên bản**: `{ data: [{ id_base, status: "pending", title, task_id, credit }] }`.
- **Trạng thái nhạc** `/api/apps/go-mmo/ai_musics/getInfo`: `id_base`, `project_id` → `{ musicInfo: { status, title, duration, audio_url, cover_url } }`. Status: `pending` (`audio_url` có thể là stream tạm), `success`, `failed`.
- **Danh sách nhạc** `/api/apps/go-mmo/ai_musics/getAll`: `search`, `project_id`.

## Ý tưởng / prompt mẫu — `/api/apps/go-mmo/ai_templates/tools`

`id_base` = `midjourney_feed_suggested` \| `kling_feed_suggested` \| `sora_feed_suggested`; `limit`, `cursor`, `category` → `{ data: { items: [{ id, prompt, image_preview }], cursor } }`.

## Dự án, space, nhóm

- **Danh sách dự án** `/api/apps/go-mmo/ai/projects` → `{ data: [{ id, id_base, name, description, password, budget, protected, created_at, updated_at }] }`. Luôn có dự án `default`.
- **Tạo dự án** `/api/apps/go-mmo/ai/project-create`: `name` (bắt buộc), `description` → `{ projectInfo }`.
- **Thông tin dự án** `/api/apps/go-mmo/ai/project-info`: `id_base` (bắt buộc), `password` → `{ projectInfo }`.
- **Thống kê dự án** `/api/apps/go-mmo/ai/project-stats`: `id_base` (bắt buộc), `password` → `{ projectStats: { daily, weekly, monthly, today, summary, details } }` (credit đã chi cho video/image/audio, tách thành công/thất bại).
- **Danh sách space** `/api/apps/go-mmo/ai_spaces/getAll`: `project_id` → `{ data: [{ id_base, name, description, project_id, created_time, updated_time }] }`.
- **Tạo space** `/api/apps/go-mmo/ai_spaces/create`: `name` (bắt buộc), `description`, `project_id` → `{ spaceInfo }`.
- **Nhóm tạo media** `/ai/generationGroups`: `type` = `IMAGE` \| `VIDEO` (bắt buộc), `project_id` → `{ data: [{ id_base, name, description, status, type, ... }] }`.

## Tài khoản

- **Thông tin tài khoản** `/api/apps/go-mmo/ai/me` → `{ userInfo: { name, username, avatar }, balancesInfo: { balance, credits_ai, currency }, videoCount }`.
- **Lịch sử giao dịch** `/api/apps/go-mmo/users/paymentsHistory`: `currency_name` (bắt buộc, vd `credits_ai`), `limit` (mặc định 5) → `{ data: [{ fluctuation_type, value_change, value_last, currency_name, source, message, created_time, id_base }] }`.
