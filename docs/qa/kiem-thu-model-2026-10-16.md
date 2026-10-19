# Kiểm thử khả năng tạo của từng model — 16/10/2026

Mỗi model tạo 1 lần ở cấu hình rẻ nhất GAIA bán được, chạy qua đúng API của GAIA (server → Gommo → đồng bộ → hoàn tiền). Prompt ảnh: "Một tách cà phê bốc khói trên bàn gỗ cạnh cửa sổ, ánh sáng buổi sáng dịu nhẹ"; prompt video: "Sóng biển nhẹ nhàng vỗ vào bờ cát lúc hoàng hôn, máy quay đứng yên". Không chạy lại: Nano Banana 2, VEO 3.1, Kling 2.5 (đã chạy được từ trước) và 4 model ảnh Gommo đang để bảo trì.

**Kết quả:** 19/45 model tạo được. Chi phí thật 45.160 credit 79ai (~45 nghìn đ); Gommo hoàn đủ tiền cho mọi lượt lỗi, GAIA hoàn đủ credit cho người dùng.

| Loại | Model | Kết quả | Credit GAIA | Thời gian | Lý do lỗi / ghi chú | Xử lý |
|---|---|---|---|---|---|---|
| Ảnh | Kling 3.0 Omni (`3.0-omni`) | ❌ Lỗi | 3 | 0.9 phút | Không thể hoàn thành #rq11 |  |
| Ảnh | Dreamina - 3.1 (`dreamina_3_1`) | ❌ Lỗi | 3 | 2431.2 phút | Gommo treo ở PENDING_ACTIVE hơn 24 giờ; GAIA hết giờ chờ và hoàn credit. |  |
| Ảnh | Flux 3 Image (`flux-3-image`) | ❌ Lỗi | 24 | 1.1 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #img_01 | Tạm ẩn khỏi GAIA |
| Ảnh | Nano Banana 2.1 (`gemini-nano-banana-2.1`) | ❌ Lỗi | 23 | 2.0 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #img_01 | Tạm ẩn khỏi GAIA |
| Ảnh | Imagen 4 (`google_image_gen_3_5`) | ❌ Lỗi | 1 | 0.3 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #cxvcxv | Tạm ẩn khỏi GAIA |
| Ảnh | Imagen 4.5 (`google_image_gen_4_5`) | ❌ Lỗi | 2 | 0.2 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #cxvcxv | Tạm ẩn khỏi GAIA |
| Ảnh | Nano Banana (`google_image_gen_banana`) | ✅ Tạo được | 3 | 1.0 phút |  |  |
| Ảnh | Nano Banana Pro (`google_image_gen_banana_pro`) | ❌ Lỗi | 5 | 0.1 phút | Chế độ Relaxed và Standard hiện không khả dụng vui lòng chọn các chế độ VIP | Đã sửa: chỉ bán chế độ VIP |
| Ảnh | GPT Image 2.5 Flare (`gpt-image-2.5-flare`) | ✅ Tạo được | 5 | 1.8 phút |  |  |
| Ảnh | GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | ✅ Tạo được | 5 | 1.7 phút |  |  |
| Ảnh | Ideogram 4.5 (`ideogram-4-5`) | ❌ Lỗi | 12 | 1.0 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #img_01 | Tạm ẩn khỏi GAIA |
| Ảnh | GPT Image 2 (`imagegen_2_0`) | ❌ Lỗi | 7 | 1.9 phút | Nguồn ảnh gặp sự cố, vui lòng thử lại. |  |
| Ảnh | COLORS 1.5 - Kling AI (`kling_colors_1_5`) | ✅ Tạo được | 2 | 0.7 phút |  |  |
| Ảnh | COLORS 2.0 - Kling AI (`kling_colors_2_0`) | ✅ Tạo được | 2 | 1.4 phút |  |  |
| Ảnh | COLORS 2.1 - Kling AI (`kling_colors_2_1`) | ✅ Tạo được | 2 | 0.7 phút |  |  |
| Ảnh | Midjourney 7.0 (`midjourney_7_0`) | ❌ Lỗi | 6 | 0.6 phút | Không thể hoàn thành #csdsd2 |  |
| Ảnh | Midjourney 8.1 (`midjourney_8_0`) | ❌ Lỗi | 6 | 1.5 phút | Không thể hoàn thành #csdsd2 |  |
| Ảnh | Midjourney 8.2 (`midjourney_8_2`) | ❌ Lỗi | 6 | 1.7 phút | Không thể hoàn thành #csdsd2 |  |
| Ảnh | IMAGE O1 - Kling (`o1`) | ✅ Tạo được | 3 | 0.8 phút |  |  |
| Ảnh | Seedream - 4.0 (`seedream_4_0`) | ❌ Lỗi | 3 | 0.5 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #img_01 | Tạm ẩn khỏi GAIA |
| Ảnh | Seedream 4.5 (`seedream_4_5`) | ❌ Lỗi | 6 | 2432.1 phút | Quá 60' không thể hoàn thành! |  |
| Ảnh | Seedream 5 Lite (`seedream_5_0`) | ❌ Lỗi | 7 | 2432.2 phút | Quá 60' không thể hoàn thành! |  |
| Ảnh | Seedream 5.0 Flash (`seedream-5-0-flash`) | ✅ Tạo được | 8 | 1.3 phút |  |  |
| Ảnh | Seedream 5.0 Pro (`seedream-5-0-pro`) | ✅ Tạo được | 19 | 1.4 phút |  |  |
| Ảnh | Z-Image (`z_image`) | ✅ Tạo được | 2 | 1.0 phút |  |  |
| Video | FLUX 3 (`flux_3`) | ❌ Lỗi | 207 | 0.5 phút | Model tạm thời bảo trì, vui lòng quay lại sau #vid_maintenance | Tạm ẩn khỏi GAIA |
| Video | Gemini Omni Flash 1.1 (`gemini_omni_flash_1_1`) | ❌ Lỗi | 21 | 1.9 phút | Tạo video thất bại #vid_fail |  |
| Video | Grok Video - Heavy (`grok_video_heavy`) | ✅ Tạo được | 22 | 1.1 phút |  |  |
| Video | Hailuo 2.3 (`hailuo_2_3`) | ❌ Lỗi | 12 | 0.1 phút | Model Hailuo 2.3 cần ảnh tham chiếu khung hình đầu. | Đã sửa: bắt buộc Start frame |
| Video | Happy Horse 1.0 (`happy_horse_1`) | ❌ Lỗi | 79 | 0.5 phút | Model tạm thời bảo trì, vui lòng quay lại sau #vid_maintenance | Tạm ẩn khỏi GAIA |
| Video | Heygen Video (`heygen_video`) | ❌ Lỗi | 57 | 0.4 phút | Tạo video thất bại |  |
| Video | Kling - 2.1 - 10s - FULL HD (`kling_video_2_1_10s`) | ❌ Lỗi | 75 | 0.1 phút | Vui lòng đính kèm ảnh. | Đã sửa: bắt buộc Start frame |
| Video | Kling - 2.1 - 5s - FULL HD (`kling_video_2_1_5s`) | ❌ Lỗi | 45 | 0.1 phút | Vui lòng đính kèm ảnh. | Đã sửa: bắt buộc Start frame |
| Video | Kling 2.6 (`kling_video_2_6`) | ✅ Tạo được | 38 | 1.4 phút |  |  |
| Video | Kling 3.0 Omni (`kling_video_3_0`) | ❌ Lỗi | 44 | 2432.1 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #cg33 | Tạm ẩn khỏi GAIA |
| Video | Kling O1 (`kling_video_o1`) | ❌ Lỗi | 38 | 1.1 phút | Hiện gói dịch vụ không khả dụng tại thời điểm này #cg33 | Tạm ẩn khỏi GAIA |
| Video | Meta Muse 1.0 (`meta_muse_video`) | ✅ Tạo được | 23 | 2.4 phút |  |  |
| Video | Minimax H3 (`minimax_h3`) | ❌ Lỗi | 180 | 0.6 phút | Model tạm thời bảo trì, vui lòng quay lại sau #vid_maintenance | Tạm ẩn khỏi GAIA |
| Video | Minimax H3 Max (`minimax_h3_max`) | ❌ Lỗi | 89 | 0.6 phút | Model tạm thời bảo trì, vui lòng quay lại sau #vid_maintenance — Model tạm thời bảo trì, vui lòng quay lại sau #vid_maintenance | Tạm ẩn khỏi GAIA |
| Video | Seedance 2.0 Mini (`seedance_20_mini`) | ✅ Tạo được | 84 | 2.7 phút |  |  |
| Video | Seedance 2.0 (`seedance_20_pro`) | ✅ Tạo được | 55 | 0.9 phút | Gommo tạo xong (đã trừ 3.630) nhưng GAIA cũ hiểu nhầm trạng thái tạm thời là lỗi và hoàn credit. Đã sửa 17/10. |  |
| Video | Seedance 2.0 Omni (`seedance_20_pro_edit`) | ✅ Tạo được | 91 | 2431.2 phút |  |  |
| Video | Seedance 2.5 (`seedance_25_omni`) | ✅ Tạo được | 248 | 2431.8 phút |  |  |
| Video | Gemini Omni Flash 1.0 (`veo_omni`) | ✅ Tạo được | 21 | 2.3 phút |  |  |
| Video | WAN 3.0 (`wan_3_0`) | ✅ Tạo được | 50 | 2432.0 phút |  |  |

**Sau kiểm thử (17/10):** Gommo thêm 2 model mới chưa kiểm thử: Kling 4.0 (`kling_4_0`) và Kling 4.0 Flash (`kling_4_0_flash`).

## Vòng 2 và 3 — 18/10/2026

Chạy qua đúng API của GAIA (dev server), trừ các model đã ẩn thì gửi thẳng Gommo với đúng tham số GAIA dùng hôm 16/10. Chức năng phụ được kiểm tra **bằng mắt** (ảnh ra, khung đầu/cuối của video), không chỉ dựa vào status: vài model báo thành công nhưng bỏ qua ảnh gửi kèm. Ảnh mẫu: Reference = cốc gốm + tô phở + rừng tre (`public/samples`); Start frame = `song-bien-poster.webp`, End frame = cùng ảnh phóng to vào con sóng. Chi phí thật: số dư 79ai 122.140 → 69.015 (~53 nghìn đ); Gommo hoàn tiền mọi lượt lỗi.

Sau vòng này GAIA chuyển sang **danh sách trắng** `VERIFIED_MODELS` (`lib/models.server.ts`): chỉ model và chức năng đã kiểm chứng mới hiện; model Gommo thêm sau bị ẩn tới khi kiểm thử.

### Tạo từ prompt (vòng 2)

| Model | Kết quả | Ghi chú | Xử lý |
|---|---|---|---|
| Nano Banana Pro (VIP) | ✅ | | Bán |
| Kling 4.0, Kling 4.0 Flash | ✅ | Model mới Gommo thêm 17/10 | Bán |
| Kling 3.0 Omni (ảnh), GPT Image 2 | ✅ | Lần 16/10 lỗi, lần này chạy được | Bán lại |
| Midjourney 7.0 / 8.1 / 8.2 | ❌ | "Không thể hoàn thành #csdsd2", **cả với prompt tiếng Anh** | Ẩn |
| Heygen Video, Gemini Omni Flash 1.1 | ❌ | "Tạo video thất bại" | Ẩn |
| Seedream 4.5 | ❌ | "Quá 60' không thể hoàn thành!" (lần 2/2) | Ẩn |
| Seedream 5 Lite | ⚠️ | Ra ảnh sau hơn 60 phút chờ; 16/10 thì hết giờ | Ẩn (quá chậm, không ổn định) |
| Dreamina 3.1 | ❌ | Treo PENDING_ACTIVE nhiều giờ (lần 2/2) | Ẩn |
| Seedream 5.0 Pro / Flash | ❌ | "#img_bp Máy chủ tạo ảnh không khả dụng" (chạy được 16/10) | Ẩn tạm, thử lại sau |
| Hailuo 2.3 (+ Start frame) | ❌ | "Hiện gói dịch vụ không khả dụng" | Ẩn |
| Kling 2.1 5s / 10s (+ Start frame) | ❌ | "#54hh … File ảnh, Video chất lượng quá thấp" ở Standard và Professional, ảnh 960×540 và 2752×1536 | Ẩn (bắt buộc Start frame) |

### Chức năng phụ (vòng 3)

| Model | Reference (3 ảnh) | Sửa ảnh | Start frame | Start + End |
|---|---|---|---|---|
| Nano Banana 2 | ✅ | ✅ (11/10) | | |
| Nano Banana Pro | ✅ | ✅ | | |
| Nano Banana | ✅ | ✅ (xong sau 16 phút vì hàng chờ Gommo) | | |
| GPT Image 2 | ✅ | ✅ | | |
| GPT Image 2.5 Flare / Sunburst | ✅ | ✅ | | |
| Kling 3.0 Omni (ảnh) | ✅ | ✅ | | |
| IMAGE O1 | ✅ | ✅ | | |
| COLORS 2.0 | ✅ | ❌ #rq11 | | |
| COLORS 1.5, COLORS 2.1, Z-Image | — | ❌ ra ảnh mới, bỏ qua ảnh gốc | | |
| Seedream 5.0 Pro / Flash | ❌ #img_bp | ❌ #img_bp | | |
| VEO 3.1, Kling 2.5 | | | ✅ (11–12/10) | ✅ (Kling 2.5: chỉ Professional) |
| Kling 4.0 | | | ✅ | ✅ |
| Seedance 2.0 | | | ✅ | ✅ |
| Kling 4.0 Flash, Kling 2.6, Grok Video Heavy | | | ✅ | — |
| Meta Muse 1.0 | | | ❌ đúng 2/3 lần, không ổn định | ❌ lần 1 sai khung cuối; lần 2 sai cả khung đầu và cuối |
| WAN 3.0 | | | ❌ video ra cảnh khác (cheap và vip) | ❌ như trên |
| Gemini Omni Flash 1.0 (`veo_omni`) | | | ❌ #vid_fail 2/2 | — |

✅ = đã kiểm chứng và đang bật; ❌ = đang tắt; — = Gommo không hỗ trợ; ô trống = không áp dụng.

### Founder duyệt video mẫu (18/10/2026)

Trang duyệt: https://claude.ai/artifact/7MT8PibRZEhKLQ2YvL2Lyy (cùng prompt sóng biển cho mọi model, kèm video Start/End frame).

- **Bỏ (đã ẩn khỏi GAIA):** Meta Muse 1.0, Gemini Omni Flash 1.0 (`veo_omni`).
- **Giữ và kiểm thử sâu:** VEO 3.1, Kling 2.5, Kling 2.6, WAN 3.0 (chỉ từ prompt; Start/End frame vẫn tắt), Seedance 2.0, Grok Video Heavy, Kling 4.0, Kling 4.0 Flash.
- **Giữ, không kiểm thử sâu** (chỉ tạo từ prompt; Seedance 2.5 còn vì đắt): Seedance 2.0 Mini, Seedance 2.0 Omni, Seedance 2.5.

## Kiểm thử sâu video — 18–19/10/2026

Chạy qua đúng API của GAIA. Prompt tiếng Việt có chỉ dẫn máy quay / chuyển động (xe đạp ở phố cổ Hội An, máy quay lia; mèo cam nhảy lên bậu cửa; mưa trên mái tôn). Start/End frame: ảnh phong cảnh 2K cắt giữa theo đúng tỉ lệ (16:9, 9:16, 1:1), End = cùng ảnh phóng to. Kiểm tra khung đầu/cuối bằng mắt; **giá Gommo thu (`gommo_cost`) khớp giá GAIA hiển thị ở cả 14 lượt có tính phí** (= giá Gommo × 1,5 ÷ 100, làm tròn lên). Chi phí: ~66 nghìn đ (79ai 69.365 → khoảng 2.750; lượt lỗi được hoàn).

| Model | Lượt | Kết quả |
|---|---|---|
| VEO 3.1 | lite 4K 4s 9:16 | ❌ "Thời lượng 4s không khả dụng #vid_duration_unavailable" → chặn 4 giây |
| | fast 1080p 6s 16:9 | ✅ |
| | quality 720p 8s 16:9 + Start/End | ✅ khung đầu và cuối đúng |
| Kling 2.5 | relax 10s 1:1 + Start | ❌ từ chối ngay: "Kling 2.5 Relax chỉ hỗ trợ thời lượng 5s" (Gommo vẫn có giá) → chặn |
| | standard 5s 9:16 + Start | ✅ |
| | professional 5s 16:9 + Start/End | ✅ |
| Kling 2.6 | professional_audio 5s 16:9 | ✅ có rãnh tiếng; tự thêm một người vào cảnh |
| Kling 4.0 | 1080p 3s 9:16 + Start (ảnh 864×1536) | ❌ "Kling media verification incomplete (image #1)" — cần thử lại |
| | 1080p 3s 16:9 | ✅ |
| | 720p 10s 16:9 + Start/End | ✅ |
| Seedance 2.0 | professional 720p 4s 1:1 + Start/End | ✅ |
| WAN 3.0 | cheap 480p 10s 16:9 | ✅ làm đúng nhất: mèo nhảy lên rồi ngồi liếm chân |
| Grok Video Heavy | Fun 720p 6s 16:9 + Start | ✅ Start đúng; mode Fun chèn nhân vật hoạt hình vào cảnh |
| | Normal 1080p 6s 1:1 | ✅ |
| | Custom 480p 15s 9:16 | ✅ (mèo ngồi sẵn trên bậu, bỏ động tác nhảy) |

**GAIA chỉ bán phạm vi đã thử** (`TESTED_RANGE` trong `lib/models.server.ts`; API trả 409 nếu gửi tổ hợp ngoài phạm vi, đã kiểm):

| Model | Mode | Độ phân giải | Thời lượng |
|---|---|---|---|
| VEO 3.1 | lite, fast, quality | 720p, 1080p | 6–8s |
| Kling 2.5 | relax, standard, professional | — | 5s |
| Kling 2.6 | standard, professional_audio | — | 5s |
| WAN 3.0 | cheap, vip | 480p | 4–10s |
| Seedance 2.0 | fast, professional | 480p, 720p | 4s |
| Grok Video Heavy | Normal, Fun, Custom (Spicy đã ẩn) | 480p, 720p, 1080p | 6–15s |
| Kling 4.0 | professional | 720p, 1080p | 3–10s |
| Kling 4.0 Flash | flash | 720p | 3s |
| Seedance 2.0 Mini / 2.5 / 2.0 Omni | đúng 1 cấu hình đã thử | | 4s |

**Chưa thử (chờ nạp 79ai, ~52 nghìn đ):** Kling 2.6 standard 10s và mode professional; WAN vip 720p/1080p; Kling 4.0 Flash 10s + Start; Seedance 2.0 fast 10s và 1080p; VEO 4K; Kling 4.0 + Start frame ảnh dọc (thử lại); Kling 4.0 trên 10s.
