# Kiểm thử vòng 2 — Hệ thống

Bản xuất ngày 12/10/2026 từ bảng kiểm thử trên claude.ai (https://claude.ai/artifact/GLEQL5BL9Px7gobtFFwvng). Bảng đó là trang riêng tư của chủ dự án; file này giữ lại toàn bộ nội dung để người khác đọc được. Dữ liệu gốc: `vong-2-he-thong.json`.

**Tổng: 59 trường hợp** — Đạt: 57 · Bỏ qua: 1 · Chưa test: 1

## A. Kiểm lại thay đổi ngày 11/10

### A01 — Không còn "Lấp đầy", ô luôn trọn khung

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Mở Studio, nhìn thanh phía trên thư viện.
- **Mong đợi:**
  - Không còn nút Trọn khung / Lấp đầy.
  - Mọi ảnh và video hiện trọn trong ô, không bị cắt (ảnh dọc có viền tối hai bên).

### A02 — Upscale đã gỡ

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Mở chi tiết một ảnh bất kỳ.
- **Mong đợi:**
  - Thanh trên chỉ còn Tải về, Dùng lại prompt và ⋯; không còn nút Upscale.
  - Các bản upscale lỗi hôm trước không còn hiện trong cột Phiên bản.

### A03 — Dán ảnh làm Reference (chế độ Ảnh)

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Trên Google Images, chuột phải vào một ảnh, chọn "Sao chép hình ảnh" (Copy image).
  2. Ở Studio chọn Ảnh, bấm vào ô prompt, nhấn Ctrl+V.
- **Mong đợi:**
  - Hiện chip "Reference" có ảnh nhỏ; ô prompt không bị chèn chữ lạ.
  - Dán chữ (Ctrl+V một đoạn văn) vẫn dán chữ như bình thường.
  - Chưa bấm Tạo thì số dư không đổi.

### A04 — Dán ảnh làm Start/End frame (chế độ Video)

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Chọn Video (VEO 3.1). Sao chép một ảnh rồi Ctrl+V vào ô prompt.
  2. Sao chép ảnh khác, Ctrl+V lần nữa.
  3. Ctrl+V lần thứ ba.
- **Mong đợi:**
  - Lần 1: chip "Start frame".
  - Lần 2: thêm chip "End frame".
  - Lần 3: thông báo đã có đủ Start frame và End frame.

### A05 — Sửa ảnh ra nhiều bản cùng lúc

- **Kết quả:** Đạt · credit dự kiến 12 · ưu tiên cao
- **Cách làm:**
  1. Mở chi tiết một ảnh đã tạo xong.
  2. Gõ một yêu cầu sửa, đổi chip "Số lượng" thành 2.
  3. Bấm "Tạo 2 bản sửa".
- **Mong đợi:**
  - Giá cạnh nút đổi thành 12 credit khi chọn 2.
  - Có thêm 2 phiên bản "Chỉnh sửa N", mỗi bản tự hiện ảnh khi xong.
  - Số dư giảm 12; trang Credit có 2 dòng "Sửa ảnh" −6.
- **Ghi chú của người test:** Lúc này tôi thử bấm tạo ảnh luôn, đang tạo thì tôi bị tự động chuyển hướng qua /studio. Ngoài ra, nên bổ sung thêm khi user hover chuột vào nút tạo thì nút sẽ sáng lên.
- **Phản hồi của Claude:** Bị chuyển về /studio: đã sửa ngày 11/10 (do máy chủ đăng nhập chập chờn; kiểm ở H01, H02). Hover nút Tạo: ĐÃ LÀM ngày 12/10. Nút sáng lên và có viền sáng khi rê chuột (cả nút Tạo, Tạo bản sửa, Tiếp tục nạp). Kiểm ở H08.

### A06 — Biểu tượng ảnh nhiều phiên bản

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Quay lại Studio, nhìn thẻ của ảnh vừa sửa.
- **Mong đợi:**
  - Góc trên trái thẻ có biểu tượng nhiều lớp kèm số phiên bản, dễ thấy hơn dòng chữ "N phiên bản".

### A07 — Chuyển vào thùng rác rồi hoàn tác

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Bấm ⋯ trên một thẻ, chọn "Chuyển vào thùng rác".
  2. Bấm Hoàn tác trên thông báo.
- **Mong đợi:**
  - Thẻ biến mất; thông báo "Đã chuyển vào thùng rác · Tự xoá vĩnh viễn sau 30 ngày" có nút Hoàn tác.
  - Số trên tab Thùng rác tăng 1, hoàn tác thì giảm lại và thẻ quay về chỗ cũ.
- **Ghi chú của người test:** Ở những item bị lỗi ko tạo được cũng nên có nút xóa cho nó.
- **Phản hồi của Claude:** ĐÃ LÀM ngày 12/10: thẻ lỗi có nút thùng rác ở góc trên bên phải (hiện khi rê chuột; trên điện thoại luôn hiện), có hoàn tác như thẻ thường. Kiểm ở H10.

### A08 — Khôi phục từ Thùng rác

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Chuyển một ảnh vào thùng rác (không hoàn tác).
  2. Bấm tab "Thùng rác", bấm "Khôi phục" trên thẻ đó.
  3. Quay lại tab Tất cả.
- **Mong đợi:**
  - Trong Thùng rác thẻ ghi "Tự xoá vĩnh viễn sau 30 ngày".
  - Khôi phục: thẻ rời Thùng rác, có thông báo "Đã khôi phục vào thư viện".
  - Ảnh quay lại thư viện, giữ đủ các phiên bản.

### A09 — Xoá vĩnh viễn một mục

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Trong Thùng rác bấm "Xoá vĩnh viễn" trên một thẻ.
  2. Bấm Huỷ, rồi làm lại và bấm "Xoá".
- **Mong đợi:**
  - Lần đầu hiện câu hỏi "Xoá vĩnh viễn?" kèm nút Xoá và Huỷ; Huỷ thì không mất gì.
  - Bấm Xoá: thẻ biến mất hẳn, có thông báo "Đã xoá vĩnh viễn".
  - Trang Credit vẫn giữ nguyên các dòng giao dịch cũ của ảnh đó.

### A10 — Dọn thùng rác

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Chuyển 2 ảnh vào thùng rác.
  2. Trong tab Thùng rác bấm "Dọn thùng rác" (góc phải), rồi "Xoá hết".
- **Mong đợi:**
  - Có câu hỏi "Xoá vĩnh viễn mọi mục trong thùng rác?" trước khi xoá.
  - Sau khi xoá: thông báo "Đã xoá vĩnh viễn 2 mục", Thùng rác trống, tab không còn số.
- **Ghi chú của người test:** sửa lại khi user hover vào nút xóa thì nút xóa sáng lên.
- **Phản hồi của Claude:** ĐÃ LÀM ngày 12/10: "Dọn thùng rác" sáng nền đỏ nhạt khi rê chuột; nút xác nhận "Xoá vĩnh viễn" sáng hơn và có viền sáng. Kiểm ở H09.

### A11 — Sắp xếp lịch sử giao dịch

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Mở trang Credit, ở Lịch sử giao dịch bấm "Cũ nhất", rồi "Mới nhất".
  2. Thử thêm khi đang ở tab Sử dụng.
- **Mong đợi:**
  - Cũ nhất: dòng "Tặng credit · Credit dùng thử" lên đầu.
  - Mới nhất: giao dịch gần nhất lên đầu.
  - Đổi sắp xếp vẫn giữ tab lọc đang chọn.

## B. Tạo video

### B01 — Tạo video từ prompt tiếng Việt

- **Kết quả:** Đạt · credit dự kiến 12 · ưu tiên cao
- **Cách làm:**
  1. Ở Studio chọn Video, model VEO 3.1.
  2. Chọn Mode Lite, Resolution 720p, Duration 8s, Ratio 16:9. Kiểm tra cạnh nút Tạo ghi 12 credit.
  3. Gõ: Một chiếc đèn lồng đỏ đung đưa trước gió ở phố cổ Hội An, máy quay tiến chậm
  4. Bấm Tạo và ở lại trang Studio.
- **Mong đợi:**
  - Số dư giảm 12 ngay khi bấm.
  - Thẻ mới: "Đang chờ xử lý" rồi "Đang render · m:ss", kèm dòng "Bạn có thể rời trang…". Góc phải thanh thư viện có "1 đang chạy".
  - Khoảng 2–3 phút sau thẻ có ảnh đại diện, nút phát, nhãn "Video · 16:9" và "0:08"; có thông báo "Video đã tạo xong" kèm nút Xem.
  - Video đúng nội dung câu tiếng Việt (GAIA tự dịch, bạn không cần viết tiếng Anh).
- **Ghi chú của người test:** Thêm chức năng hover chuột vào thì video tự động play.
- **Phản hồi của Claude:** Ngày 12/10: tạm không làm (rê chuột tự phát video) theo quyết định của anh, vì lo làm hệ thống chậm.

### B02 — Giá video đổi theo Mode và Resolution

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Với VEO 3.1, lần lượt chọn các tổ hợp và đọc số credit cạnh nút Tạo (không bấm Tạo).
- **Mong đợi:**
  - Lite 720p = 12, Fast 720p = 18, Lite 1080p = 18, Fast 1080p = 24, Quality 720p = 90 credit.
  - Đổi Duration 4s / 6s / 8s không đổi giá (VEO 3.1 tính theo Mode và Resolution).

### B03 — Video có Start frame

- **Kết quả:** Đạt · credit dự kiến 12 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Chọn VEO 3.1, Lite, 720p.
  2. Bấm "+ Start frame" chọn một ảnh (hoặc sao chép ảnh rồi Ctrl+V vào ô prompt).
  3. Gõ: Cảnh trong ảnh bắt đầu chuyển động nhẹ, máy quay tiến chậm
  4. Bấm Tạo.
- **Mong đợi:**
  - Chip "Start frame" có ảnh nhỏ.
  - Video mở đầu bằng đúng khung hình của ảnh đã chọn rồi mới chuyển động.
  - Nếu báo lỗi, hoặc video không liên quan gì tới ảnh: chọn Lỗi. Khi đó cách GAIA gửi ảnh khung sang Gommo đang sai.
- **Phản hồi của Claude:** Đã đối chiếu dữ liệu: Gommo nhận đúng Start frame (createFromImageStart), cảnh đầu video khớp ảnh. Lần 9:16 đầu tiên bị Google chặn (#vid_policy), lần 16:9 sau thành công, đã hoàn credit lần lỗi. Phát hiện thêm: ảnh 3:2 trong video 16:9 bị viền đen hai bên. Đã sửa bằng tự cắt ảnh khung theo tỉ lệ video (kiểm ở H04–H07).

### B04 — Video có Start frame và End frame

- **Kết quả:** Đạt · credit dự kiến 12 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Chuẩn bị 2 ảnh KHÔNG có người thật (phong cảnh, đồ vật), cùng tỉ lệ nếu được.
  2. Chọn Video, model VEO 3.1, Lite 720p, Ratio 16:9. Bấm "+ Start frame" chọn ảnh thứ nhất, rồi "+ End frame" chọn ảnh thứ hai.
  3. Gõ: Chuyển cảnh mượt từ ảnh đầu sang ảnh cuối
  4. Bấm Tạo.
- **Mong đợi:**
  - Có hai chip Start frame và End frame.
  - Video bắt đầu ở ảnh thứ nhất và kết thúc ở ảnh thứ hai.
- **Phản hồi của Claude:** Đã chạy 2 lần ngày 11/10 (21:41 và 21:46): Gommo nhận đúng 2 ảnh theo đúng thứ tự (createFromImageStartAndEnd), nhưng cả 2 lần bị Google chặn vì chính sách (#vid_policy), đã hoàn đủ credit. Chưa có video thành công nên chưa xem được cảnh đầu/cuối. Làm lại với 2 ảnh không có người thật (cách làm đã cập nhật).

### B05 — End frame chỉ mở khi đã có Start frame

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Chọn VEO 3.1, chưa thêm Start frame, rê chuột lên "+ End frame".
  2. Thêm Start frame và End frame, rồi bấm × trên chip Start frame.
- **Mong đợi:**
  - Khi chưa có Start frame, nút End frame mờ và ghi "Thêm Start frame trước".
  - Xoá Start frame thì End frame cũng bị xoá theo.

### B06 — Tạo video bằng model khác (Kling 2.5)

- **Kết quả:** Đạt (Claude tự test) · credit dự kiến 12 · ưu tiên trung bình
- **Cách làm:**
  1. Bấm nút tên model, chọn Kling 2.5.
  2. Bấm "+ Start frame", chọn một ảnh không có người thật.
  3. Chọn Mode Relax, Duration 5s sao cho cạnh nút Tạo ghi 12 credit.
  4. Gõ: Lá cây khẽ lay trong gió, máy quay đứng yên. Bấm Tạo.
- **Mong đợi:**
  - Các chip thông số đổi theo Kling 2.5 (chỉ hiện những gì model hỗ trợ).
  - Số dư giảm đúng số credit đã hiện trước khi bấm.
  - Ra video bắt đầu từ ảnh đã chọn, đúng prompt.
- **Phản hồi của Claude:** Claude đối chiếu video Kling 2.5 anh tạo lúc 07:58 ngày 12/10: có Start frame, trừ đúng 12 credit như đã hiện, video 720×1280 kín khung, cảnh đầu khớp ảnh. (3 lần Kling Start + End bị từ chối là chuyện khác, xem H12.)

### B07 — Video lỗi được hoàn credit

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Chỉ test nếu gặp thẻ "Không tạo được video" trong lúc làm nhóm B; không gặp thì chọn Bỏ qua.
- **Mong đợi:**
  - Thẻ lỗi ghi "Đã hoàn N credit", có nút Thử lại · N và Dùng lại prompt.
  - Trang Credit có dòng "Hoàn credit" +N.

## C. Chi tiết video

### C01 — Trang chi tiết video

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Bấm vào video đã tạo ở B01.
- **Mong đợi:**
  - Trình phát lớn có nút phát ở giữa; thanh dưới có phát/tạm dừng, thời gian, thanh tua, tắt tiếng, toàn màn hình.
  - Cột phải: Thông tin (Model, Mode, Ratio, Resolution, Duration, Credit, Tạo lúc) và Prompt có nút sao chép.
  - Thanh trên: Tạo lại · N credit, Tải về, Dùng lại prompt, ⋯.

### C02 — Điều khiển trình phát

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Bấm phát, tạm dừng, kéo thanh tua, bấm tắt tiếng, bấm toàn màn hình rồi Esc.
- **Mong đợi:**
  - Mỗi nút làm đúng việc của nó; thời gian chạy theo khi phát và khi tua.
  - Toàn màn hình mở và thoát được.

### C03 — Ảnh khung hiện trong trang chi tiết

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Mở chi tiết video đã tạo ở B04.
- **Mong đợi:**
  - Cột phải có mục "Input frames" với đúng ảnh Start frame và End frame đã dùng.

### C04 — Tải video về máy

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Ở trang chi tiết video bấm Tải về.
- **Mong đợi:**
  - Máy tải về file .mp4 phát được, đúng video đang xem.

### C05 — Tạo lại video

- **Kết quả:** Đạt · credit dự kiến 12 · ưu tiên trung bình
- **Cách làm:**
  1. Ở trang chi tiết video B01 bấm "Tạo lại · 12 credit".
- **Mong đợi:**
  - Quay về Studio, có thẻ mới đang chạy với cùng prompt và thông số.
  - Số dư giảm đúng số credit ghi trên nút.

### C06 — Dùng lại prompt từ video

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở trang chi tiết video B04 bấm "Dùng lại prompt".
- **Mong đợi:**
  - Về Studio; khung soạn có sẵn prompt, model, thông số và cả Start/End frame.
  - Không tạo gì, số dư không đổi.

### C07 — Chuyển video vào thùng rác

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở trang chi tiết một video bấm ⋯ rồi "Chuyển vào thùng rác".
  2. Mở tab Thùng rác.
- **Mong đợi:**
  - Quay về Studio, video không còn trong thư viện.
  - Video nằm trong tab Thùng rác, khôi phục được.

## D. Tiến độ và thông báo

### D01 — Trang chi tiết tự cập nhật khi video xong

- **Kết quả:** Bỏ qua · ưu tiên trung bình
- **Cách làm:**
  1. Trong lúc một video đang render (vd khi làm B03), bấm vào thẻ của nó để mở trang chi tiết và đợi.
- **Mong đợi:**
  - Trang hiện trạng thái đang xử lý kèm đồng hồ chạy.
  - Khi xong, trang tự chuyển sang trình phát mà không cần tải lại.
- **Ghi chú của người test:** Video phải render thành công rồi tôi mới click được. Và tôi nghĩ cũng nên làm như vậy.
- **Phản hồi của Claude:** Đồng ý với anh: thẻ đang render không bấm vào được, chỉ mở chi tiết khi đã xong, là đúng thiết kế. Case này viết theo giả định cũ nên Claude chuyển sang Bỏ qua.

### D02 — Số dư trên góc phải luôn đúng

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Sau mỗi lần tạo trong nhóm B và C, nhìn ô credit ở góc phải trên.
- **Mong đợi:**
  - Số dư giảm ngay sau mỗi lần bấm Tạo/Tạo lại, khớp với trang Credit.
  - Nếu có lỗi được hoàn, số dư tự cộng lại.

## E. Credit và tài khoản

### E01 — Bảng nhỏ "Lịch sử credit"

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Bấm ô credit ở góc phải trên.
- **Mong đợi:**
  - Hiện "Lịch sử credit", "Số dư N" và 4 giao dịch gần nhất (tên, chi tiết, thời gian, số +/−).
  - Nút "Nạp credit" mở trang Credit.

### E02 — Menu tài khoản

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Bấm vòng tròn chữ H ở góc phải trên.
- **Mong đợi:**
  - Hiện tên Hieu Nghia Do và email dhnghia.ctu@gmail.com.
  - Có "Credit & giao dịch" (mở trang Credit) và "Đăng xuất".
- **Ghi chú của người test:** Tôi muốn chữ Đăng xuất có màu đỏ để trông khác biệt với các chức năng khác.
- **Phản hồi của Claude:** Đã làm ngày 12/10: chữ "Đăng xuất" màu đỏ.

### E03 — Số dư và hạn dùng ở trang Credit

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Mở trang Credit, nhìn ô Số dư hiện tại.
- **Mong đợi:**
  - Số dư khớp với góc phải trên.
  - Có dòng "Credit có hạn 90 ngày kể từ ngày nạp" và "N credit sẽ hết hạn vào 08/01/2027".

### E04 — Gói nạp và thưởng

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở ô Nạp credit lần lượt bấm 50.000đ, 100.000đ, 200.000đ, 500.000đ và đọc dòng "Bạn nhận được".
- **Mong đợi:**
  - 50.000đ → 500 credit; 100.000đ → 1.000; 200.000đ → 2.100 (thưởng 5%); 500.000đ → 5.500 (thưởng 10%).
  - Gói 200.000đ có nhãn +5%, gói 500.000đ có nhãn +10%.

### E05 — Nhập số tiền khác

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở ô "Hoặc nhập số tiền khác" lần lượt gõ: 15000, 25500, 60000000, 250000.
- **Mong đợi:**
  - 15000 → báo "Số tiền tối thiểu là 20.000đ".
  - 25500 → báo "Số tiền phải là bội số của 1.000đ".
  - 60000000 → báo "Số tiền tối đa mỗi lần là 50.000.000đ".
  - 250000 → nhận 2.625 credit (2.500 + thưởng 5%).

### E06 — Nạp tiền khi chưa có PayOS

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Chọn một gói rồi nhìn nút Tiếp tục.
- **Mong đợi:**
  - Nút mờ, không bấm được; bên dưới ghi "Thanh toán đang được thiết lập. Bạn quay lại sau nhé." (đúng với hiện tại vì chưa cài PayOS).

### E07 — Lọc lịch sử giao dịch

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở Lịch sử giao dịch bấm lần lượt Nạp, Sử dụng, Hoàn credit, Tất cả.
- **Mong đợi:**
  - Nạp: có dòng "Tặng credit · Credit dùng thử" +500.
  - Sử dụng: chỉ các dòng trừ (Tạo ảnh, Sửa ảnh, Tạo video…).
  - Hoàn credit: các lần được hoàn (vd 2 lần upscale lỗi +8).

### E08 — Xem thêm giao dịch

- **Kết quả:** Đạt (Claude tự test) · ưu tiên thấp
- **Cách làm:**
  1. Khi có hơn 20 giao dịch, cuộn xuống cuối Lịch sử giao dịch và bấm "Xem thêm".
- **Mong đợi:**
  - Có thêm các giao dịch cũ hơn, không lặp dòng nào.
  - Hết giao dịch thì nút Xem thêm biến mất.
- **Phản hồi của Claude:** Claude tự test: 47 giao dịch. Trang đầu 20 dòng, bấm Xem thêm ra đủ 47 dòng, khớp số trong database, không thiếu dòng nào; hết giao dịch thì nút biến mất.

## F. Trang chủ, đăng nhập, trang phụ

### F01 — Bảng Model và giá

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Mở localhost:3000, cuộn tới "Model và giá", bấm "Xem thêm 40 model".
- **Mong đợi:**
  - Mở đủ danh sách; mỗi dòng có tên, Video/Ảnh, nhãn khả năng và giá từ.
  - Giá "từ" của VEO 3.1 (12) và Nano Banana 2 (6) khớp với mức rẻ nhất trong khung soạn Studio.

### F02 — Mục "Tạo bằng GAIA"

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Rê chuột lên một video mẫu, rồi rời chuột.
- **Mong đợi:**
  - Rê chuột thì video phát (không tiếng), rời chuột thì dừng.
  - Ảnh mẫu hiển thị rõ, có nhãn "Ảnh · 16:9" hoặc "Video · 16:9" và "0:08".

### F03 — Liên kết "Model và giá" trên đầu trang

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Ở đầu trang chủ bấm "Model và giá".
- **Mong đợi:**
  - Trang cuộn xuống đúng bảng Model và giá.

### F04 — Điều khoản và Chính sách bảo mật

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Ở chân trang chủ bấm "Điều khoản sử dụng", rồi "Chính sách bảo mật".
- **Mong đợi:**
  - Hai trang mở được nhưng hiện mới có dòng tạm "[Nội dung … sẽ được cập nhật tại đây.]".
  - Chọn Lỗi để nhắc rằng cần soạn nội dung thật trước khi mở cho người dùng.

### F05 — Trang không tồn tại

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Gõ vào thanh địa chỉ: localhost:3000/abc
- **Mong đợi:**
  - Hiện "Không tìm thấy trang này" và nút "Về Studio".

### F06 — Chưa đăng nhập thì không vào được Studio và Credit

- **Kết quả:** Đạt (Claude tự test) · ưu tiên cao
- **Cách làm:**
  1. Đăng xuất (menu tài khoản).
  2. Gõ vào thanh địa chỉ: localhost:3000/studio
  3. Gõ: localhost:3000/credit
- **Mong đợi:**
  - Cả hai đều chuyển sang trang Đăng nhập, không lộ thư viện hay số dư.
- **Phản hồi của Claude:** Claude tự test (trình duyệt chưa đăng nhập): /studio và /credit đều chuyển về trang đăng nhập, giữ đúng trang muốn vào (next=/studio, next=/credit).

### F07 — Đã đăng nhập thì /login vào thẳng trang cần vào

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Đang đăng nhập, gõ: localhost:3000/login
  2. Gõ tiếp: localhost:3000/login?next=/credit
- **Mong đợi:**
  - Bước 1: chuyển thẳng vào Studio, không hiện trang đăng nhập.
  - Bước 2: chuyển thẳng vào trang Credit (trước 12/10 luôn về Studio).

## G. Giao diện điện thoại

### G01 — Studio trên màn hình điện thoại

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Ở Studio nhấn F12, bấm biểu tượng điện thoại/máy tính bảng (Toggle device toolbar, hoặc Ctrl+Shift+M).
  2. Chọn iPhone 12 Pro ở thanh trên, rồi tải lại trang.
- **Mong đợi:**
  - Không có thanh cuộn ngang; thẻ xếp 1 cột.
  - Khung soạn dùng được: chọn Ảnh/Video, model, thông số, gõ prompt.
  - Các tab Tất cả · Ảnh · Video · Thùng rác không bị che.
- **Phản hồi của Claude:** Claude chụp ở khổ 390×844: không tràn ngang, các nút đủ lớn. Khung tạo vẫn chiếm khá nhiều chiều cao màn hình (đã biết, để làm sau).

### G02 — Trang chủ trên điện thoại

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Vẫn ở chế độ điện thoại, mở localhost:3000.
- **Mong đợi:**
  - Đầu trang gọn một dòng (logo và Đăng nhập/Vào Studio).
  - Không tràn ngang; bảng giá xếp gọn; khung prompt dùng được.
- **Phản hồi của Claude:** Claude chụp ở khổ 390×844: tiêu đề, ô prompt và danh sách ý tưởng xếp chồng gọn, không tràn ngang.

### G03 — Chi tiết ảnh và video trên điện thoại

- **Kết quả:** Đạt (Claude tự test) · ưu tiên thấp
- **Cách làm:**
  1. Mở chi tiết một ảnh, rồi một video.
- **Mong đợi:**
  - Ảnh/video ở trên, cột Phiên bản và Thông tin xuống bên dưới.
  - Các nút ở thanh trên tự xuống dòng, không bị cắt.
- **Phản hồi của Claude:** Claude chụp chi tiết ảnh và video ở khổ 390×844: không tràn ngang, ảnh/video vừa khung, nút Tải về / Dùng lại prompt / Tạo lại đủ lớn.

### G04 — Trang Credit trên điện thoại

- **Kết quả:** Đạt (Claude tự test) · ưu tiên thấp
- **Cách làm:**
  1. Mở trang Credit.
- **Mong đợi:**
  - Ô Nạp credit và Lịch sử giao dịch xếp chồng, đọc được; không tràn ngang.
- **Phản hồi của Claude:** Claude chụp ở khổ 390×844: ô Nạp credit và Lịch sử giao dịch xếp chồng, đọc được, không tràn ngang.

## H. Thay đổi ngày 12/10

### H01 — Mất kết nối máy chủ đăng nhập: không bị đá ra

- **Kết quả:** Chưa test · ưu tiên cao
- **Cách làm:**
  1. Đang đăng nhập, mở localhost:3000/studio. Giữ nguyên npm run dev.
  2. Tắt Wi-Fi (hoặc rút dây mạng).
  3. Gõ vào thanh địa chỉ: localhost:3000/credit rồi Enter. Đợi tối đa khoảng 30 giây.
  4. Bật Wi-Fi lại, đợi vài giây, bấm "Thử lại".
- **Mong đợi:**
  - Bước 3: KHÔNG bị chuyển sang trang đăng nhập hay về /studio. Hiện trang "Chưa tải được trang này" với dòng "Không kết nối được máy chủ đăng nhập. Bạn thử lại sau ít phút.", nút Thử lại và Trang chủ.
  - Bước 4: trang Credit hiện bình thường.
- **Phản hồi của Claude:** Case này cần tắt Wi-Fi thật nên để anh làm (khoảng 1 phút). Claude đã giả lập phía server hôm 11/10 và trang lỗi hiện đúng; sau khi nâng Next 16.4 thì cần anh xác nhận lại nút Thử lại.

### H02 — Mất kết nối khi đang ở Studio: báo lỗi tại chỗ

- **Kết quả:** Đạt (Claude tự test) · ưu tiên cao
- **Cách làm:**
  1. Mở localhost:3000/studio, chọn Ảnh, gõ: Một con mèo ngủ trên bậu cửa sổ
  2. Tắt Wi-Fi, bấm Tạo. Đợi tối đa khoảng 30 giây.
  3. Bật Wi-Fi lại, mở trang Credit.
- **Mong đợi:**
  - Hiện thông báo "Không kết nối được máy chủ đăng nhập. Bạn thử lại sau ít phút."
  - Vẫn ở Studio, prompt còn nguyên; không bị chuyển sang trang đăng nhập.
  - Trang Credit không có dòng trừ tiền mới.
- **Phản hồi của Claude:** Claude tự test bằng cách cho lệnh Tạo nhận đúng phản hồi server gửi khi mất kết nối (503): hiện "Không kết nối được máy chủ đăng nhập…", vẫn ở /studio, prompt còn nguyên, không trừ credit.

### H03 — Kling 2.5 bắt buộc có Start frame

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Ở Studio chọn Video, bấm nút tên model; xem các nhãn của Kling 2.5 rồi chọn Kling 2.5.
  2. Gõ: Một chú chó chạy trên bãi cỏ (không thêm ảnh).
  3. Bấm "+ Start frame" chọn một ảnh bất kỳ. Không bấm Tạo.
- **Mong đợi:**
  - Trong danh sách model, Kling 2.5 không có nhãn "Text → Video".
  - Bước 2: nút Tạo bị khoá; dưới khung có dòng "Kling 2.5 cần Start frame để tạo video. Bạn chọn ảnh, hoặc dán ảnh (Ctrl+V) vào ô prompt."
  - Bước 3: dòng nhắc biến mất, nút Tạo mở lại khi ảnh tải xong.
- **Phản hồi của Claude:** Claude tự test: Kling 2.5 chỉ có nhãn Image → Video, Start + End frame (không có Text → Video); chưa có ảnh thì nút Tạo khoá và hiện dòng nhắc; thêm Start frame xong thì mở lại.

### H04 — Ảnh khung tự cắt theo tỉ lệ video

- **Kết quả:** Đạt (Claude tự test) · ưu tiên cao
- **Cách làm:**
  1. Chọn Video, model VEO 3.1, Ratio 16:9.
  2. Bấm "+ Start frame", chọn một ảnh dọc (chụp điện thoại) hoặc ảnh 3:2.
  3. Bấm vào hình thu nhỏ trên chip Start frame.
  4. Bấm ra ngoài khung xem trước (hoặc nhấn Esc).
- **Mong đợi:**
  - Chip ghi "Start frame · đã cắt 16:9", hình thu nhỏ nằm ngang.
  - Khung xem trước hiện phần giữa ảnh theo khung 16:9, có dòng "Đã cắt phần giữa ảnh cho đúng tỉ lệ 16:9 của video."
  - Bước 4: khung xem trước đóng.
- **Phản hồi của Claude:** Claude tự test với ảnh 1200×800: chip ghi "đã cắt 16:9", hình thu nhỏ nằm ngang, xem trước là ảnh 1200×675 kèm dòng giải thích, nhấn Esc thì đóng.

### H05 — Đổi tỉ lệ thì ảnh khung được cắt lại

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Tiếp H04: bấm chip Ratio, chọn 9:16.
  2. Bấm lại vào hình thu nhỏ trên chip Start frame.
- **Mong đợi:**
  - Chip hiện vòng xoay một lúc rồi ghi "đã cắt 9:16", hình thu nhỏ dựng đứng; nút Tạo bị khoá trong lúc vòng xoay chạy.
  - Khung xem trước là phần giữa của ảnh GỐC theo khung dọc (không bị mất phần trên/dưới đã cắt ở bước 16:9).
- **Phản hồi của Claude:** Claude tự test: đổi sang 9:16 thì chip quay vòng (nút Tạo khoá trong lúc đó) rồi ghi "đã cắt 9:16"; ảnh mới 450×800, tức cắt lại từ ảnh gốc chứ không cắt tiếp từ bản 16:9.

### H06 — Video từ ảnh đã cắt không còn viền đen

- **Kết quả:** Đạt (Claude tự test) · credit dự kiến 12 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Chọn Video, VEO 3.1, Mode Lite, Resolution 720p, Ratio 16:9 (cạnh nút Tạo ghi 12 credit).
  2. Bấm "+ Start frame", chọn một ảnh phong cảnh KHÔNG phải 16:9 (vd. ảnh dọc chụp điện thoại), không có người.
  3. Gõ: Mây trôi chậm, máy quay đứng yên. Bấm Tạo, đợi xong rồi mở video.
- **Mong đợi:**
  - Video kín khung 16:9, không có dải đen hai bên hay trên dưới.
  - Cảnh đầu video khớp với ảnh trong khung xem trước.
- **Phản hồi của Claude:** Không cần tốn 12 credit: video Kling 2.5 anh tạo lúc 07:58 ngày 12/10 dùng Start frame đã được GAIA cắt về 903×1606 (đúng 9:16); video ra kín khung 720×1280, không viền đen, cảnh đầu khớp ảnh.

### H07 — Dùng lại prompt mang theo ảnh khung

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Mở chi tiết video tạo từ Start frame ngày 11/10 (cảnh quán ăn, 16:9), bấm "Dùng lại prompt". Không bấm Tạo.
  2. Làm lại với video vừa tạo ở H06.
- **Mong đợi:**
  - Về Studio: ô prompt có prompt cũ, chip Start frame có ảnh cũ.
  - Video 11/10 (ảnh gốc 3:2): chip chạy vòng xoay một lúc rồi ghi "đã cắt 16:9".
  - Video H06: chip không có chữ "đã cắt" (ảnh đã đúng tỉ lệ).
- **Phản hồi của Claude:** Claude tự test: Dùng lại prompt video 11/10 (ảnh gốc 3:2) → prompt cũ + chip "đã cắt 16:9". Dùng lại video Kling 9:16 hôm nay → chip không có chữ "đã cắt" (ảnh đã đúng tỉ lệ).

### H08 — Nút Tạo sáng lên khi rê chuột

- **Kết quả:** Đạt (Claude tự test) · ưu tiên thấp
- **Cách làm:**
  1. Ở Studio gõ một prompt bất kỳ (không bấm Tạo).
  2. Rê chuột vào nút Tạo, rồi rời ra.
  3. Xóa hết prompt (nút Tạo bị khoá), rê chuột vào lại.
- **Mong đợi:**
  - Bước 2: nút sáng hơn và có viền sáng mờ; rời chuột thì về như cũ.
  - Bước 3: nút đang khoá thì không sáng lên.
- **Phản hồi của Claude:** Claude tự test: nút Tạo đổi từ cam #F0A93A sang sáng hơn khi rê chuột; khi đang khoá thì không đổi.

### H09 — Nút xoá trong Thùng rác sáng lên khi rê chuột

- **Kết quả:** Đạt (Claude tự test) · ưu tiên thấp
- **Cách làm:**
  1. Mở tab Thùng rác, rê chuột vào "Dọn thùng rác".
  2. Bấm "Dọn thùng rác", rê chuột vào nút xác nhận màu đỏ (KHÔNG bấm), rồi bấm Huỷ.
  3. Trên một thẻ trong Thùng rác, rê chuột vào "Xoá vĩnh viễn".
- **Mong đợi:**
  - Nút viền đỏ có nền đỏ nhạt và chữ sáng hơn khi rê chuột.
  - Nút đỏ đặc sáng hơn và có viền sáng mờ.
- **Phản hồi của Claude:** Claude tự test (không bấm xoá thật): "Dọn thùng rác" có nền đỏ nhạt khi rê chuột; nút xác nhận đỏ sáng hơn; bấm Huỷ thì thùng rác còn nguyên.

### H10 — Thẻ lỗi chuyển được vào thùng rác

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Ở Studio, rê chuột vào một thẻ "Không tạo được video".
  2. Bấm nút thùng rác ở góc trên bên phải thẻ.
  3. Bấm Hoàn tác trên thông báo; rồi làm lại bước 2 và để thông báo tự tắt.
- **Mong đợi:**
  - Nút thùng rác hiện khi rê chuột vào thẻ.
  - Thẻ biến mất, có thông báo "Đã chuyển vào thùng rác" kèm Hoàn tác; hoàn tác thì thẻ quay lại.
  - Lần 2: thẻ nằm trong tab Thùng rác, khôi phục được như thẻ thường.
- **Phản hồi của Claude:** Claude tự test trên thẻ lỗi Kling 08:01: hiện nút thùng rác khi rê chuột, chuyển vào thùng rác + Hoàn tác được, khôi phục từ tab Thùng rác được. Thẻ đã về lại thư viện như cũ. Khi test phát hiện thêm một lỗi và đã sửa (xem H13).

### H11 — Chuyển trang phản hồi ngay, nhanh hơn

- **Kết quả:** Đạt (Claude tự test) · ưu tiên cao
- **Cách làm:**
  1. Tắt hẳn npm run dev rồi chạy lại (để nhận cấu hình mới). Mở Studio, đợi trang hiện xong.
  2. Bấm một ảnh trong thư viện; xem xong bấm "Studio" để về.
  3. Đợi khoảng 10 giây; bấm số credit ở góc phải rồi bấm "Nạp credit" để sang trang Credit.
  4. Lặp lại bước 2–3 vài lần (lần đầu mỗi trang có thể chậm hơn vì dev phải biên dịch).
- **Mong đợi:**
  - Ngay khi bấm: trang cũ biến mất, hiện vòng xoay ở giữa (không còn đứng im).
  - Từ lần thứ hai: trang chi tiết hiện đủ trong khoảng nửa giây, Studio và Credit dưới khoảng 1 giây.
  - Nếu mạng đang chập chờn (như ngày 11/10) thì có thể chậm hơn: ghi lại số giây vào ghi chú.
- **Phản hồi của Claude:** Claude đo trên server dev của anh (nghỉ 8 giây giữa các lần bấm): Studio → chi tiết ảnh 0,9 giây, quay lại Studio 0,3 giây, sang Credit 1,1 giây; vòng xoay hiện trong ~0,2–0,4 giây sau khi bấm. Bản build thật nhanh hơn (chi tiết ~0,4 giây).

### H12 — Kling 2.5: Start + End frame chỉ ở Mode Professional

- **Kết quả:** Đạt (Claude tự test) · ưu tiên trung bình
- **Cách làm:**
  1. Chọn Video, Kling 2.5, Mode Relax. Thêm Start frame rồi End frame. Không bấm Tạo.
  2. Đổi Mode sang Professional.
- **Mong đợi:**
  - Bước 1: nút Tạo khoá, có dòng "Kling 2.5 chỉ tạo được Start + End frame ở Mode Professional. Bạn đổi Mode hoặc bỏ End frame."
  - Bước 2: dòng nhắc biến mất, nút Tạo mở, giá đổi theo Professional.
- **Phản hồi của Claude:** Mới thêm ngày 12/10 vì sáng nay 3 lần Kling 2.5 Start + End (Mode Relax) bị Gommo từ chối: "chỉ hoạt động ở chế độ Professional" (không mất tiền, đã hoàn). Claude tự test: Relax thì khoá + nhắc; Professional thì mở, giá 60 credit.

### H13 — Bấm sang tab Thùng rác không hiện nhầm mục của thư viện

- **Kết quả:** Đạt (Claude tự test) · ưu tiên cao
- **Cách làm:**
  1. Ở Studio tab Tất cả, bấm ngay sang tab Thùng rác.
  2. Bấm qua lại nhanh giữa Tất cả, Video, Thùng rác.
- **Mong đợi:**
  - Trong lúc tải chỉ hiện vòng xoay; không có lúc nào thẻ của thư viện hiện thành thẻ Thùng rác (có nút Khôi phục / Xoá vĩnh viễn).
  - Bấm nhanh qua lại thì cuối cùng luôn hiện đúng danh sách của tab đang chọn.
- **Phản hồi của Claude:** Lỗi Claude phát hiện khi chạy H10: vừa bấm sang Thùng rác, trong lúc chờ tải, app vẽ tạm video thư viện thành thẻ Thùng rác; bấm Khôi phục lúc đó ra lỗi "Không tìm thấy mục này" (không mất dữ liệu). Đã sửa: hiện vòng xoay tới khi tải xong, bỏ kết quả của tab cũ. Claude chạy lại H10 sau khi sửa: đạt.
