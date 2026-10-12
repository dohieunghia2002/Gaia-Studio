# Kiểm thử vòng 1 — Tạo ảnh

Bản xuất ngày 12/10/2026 từ bảng kiểm thử trên claude.ai (https://claude.ai/artifact/6V1FGJZQBgn2RN9gkKzyTo). Bảng đó là trang riêng tư của chủ dự án; file này giữ lại toàn bộ nội dung để người khác đọc được. Dữ liệu gốc: `vong-1-tao-anh.json`.

**Tổng: 34 trường hợp** — Đạt: 28 · Chưa test: 4 · Lỗi: 2

## A. Chuẩn bị

### A01 — Ví dùng thử hiện đúng

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Mở localhost:3000/studio, nhìn góc phải trên.
  2. Bấm vào ô credit để mở bảng nhỏ.
  3. Mở trang Credit & giao dịch.
- **Mong đợi:**
  - Góc phải hiện 500 credit.
  - Trang Credit: số dư 500, hạn dùng 08/01/2027.
  - Lịch sử có dòng "Tặng credit · Credit dùng thử" +500.

## B. Khung soạn ảnh

### B01 — Gợi ý ở Studio lần đầu (làm trước C01, khi thư viện còn trống)

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Khi thư viện còn trống, bấm một thẻ Ảnh trong "Ý tưởng để bắt đầu".
  2. Bấm "Gợi ý khác".
- **Mong đợi:**
  - Trang gợi ý đầu có ảnh/video mẫu thật; rê chuột lên video thì video phát.
  - Bấm thẻ: prompt được điền vào khung soạn, chế độ Ảnh; không tạo gì, số dư không đổi.
  - Gợi ý khác: trang 2 chỉ có chữ, các thẻ cao bằng nhau.

### B02 — Chuyển sang chế độ Ảnh

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Trong khung soạn ở cuối trang, bấm Ảnh.
- **Mong đợi:**
  - Model chuyển sang Nano Banana 2 (model ảnh đầu danh sách).
  - Có các chip Ratio, Resolution, Mode, Số lượng và nút + Reference.
  - Không còn nút Start frame / End frame.
  - Ô nhập ghi "Mô tả ảnh bạn muốn tạo… (Enter để gửi)".

### B03 — Nút Tạo khoá khi chưa có prompt

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Để trống ô prompt, bấm Tạo và nhấn Enter.
  2. Gõ vài dấu cách rồi thử lại.
- **Mong đợi:**
  - Nút Tạo mờ, không bấm được.
  - Enter không gửi gì, số dư không đổi.

### B04 — Giá đổi theo thông số

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Chọn Nano Banana 2, Resolution 1K, Số lượng 1, đọc số credit cạnh nút Tạo.
  2. Đổi Số lượng thành 4.
  3. Đổi Resolution sang 2K, xem giá, rồi trả về 1K và Số lượng 1.
- **Mong đợi:**
  - 1K × 1 ảnh = 6 credit.
  - Số lượng 4 = 24 credit.
  - 2K đắt hơn 1K (11 hoặc 12 credit một ảnh tuỳ Mode).

### B05 — Danh sách model ảnh

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Bấm nút tên model (Nano Banana 2).
  2. Lướt danh sách, chọn một model khác, rồi chọn lại Nano Banana 2.
- **Mong đợi:**
  - Mỗi dòng có tên, nhãn khả năng (Text → Image, Reference…) và giá "từ X".
  - Model đang chọn có dấu ✓.
  - Model tạm ngưng (nếu có) bị mờ và ghi lý do.
  - Đổi model thì giá cạnh nút Tạo đổi theo.

### B06 — Prompt tối đa 2.000 ký tự

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Dán một đoạn văn dài hơn 2.000 ký tự vào ô prompt.
  2. Xoá đi trước khi sang dòng khác.
- **Mong đợi:**
  - Ô prompt chỉ nhận tối đa 2.000 ký tự.

## C. Tạo ảnh

### C01 — Tạo 1 ảnh từ prompt tiếng Việt

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên cao
- **Cách làm:**
  1. Gõ: Một chiếc xe đạp cũ dựng trước quán cà phê vỉa hè Hà Nội, buổi sáng, ánh nắng nghiêng
  2. Ratio 16:9, Resolution 1K, Số lượng 1, bấm Tạo.
  3. Chờ, không rời trang.
- **Mong đợi:**
  - Thẻ mới xuất hiện đầu thư viện: "Đang chờ xử lý" rồi "Đang render · m:ss".
  - Số dư giảm 6 ngay khi bấm (500 → 494).
  - Khoảng 1 phút sau thẻ hiện ảnh, có thông báo "Ảnh đã tạo xong" kèm nút Xem.
  - Dòng dưới thẻ: "Nano Banana 2 · 16:9 · 1K" và 6 credit.

### C02 — Ảnh đúng nội dung prompt

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Mở ảnh vừa tạo ở C01.
- **Mong đợi:**
  - Ảnh có xe đạp cũ, quán cà phê vỉa hè, nắng sáng: đúng câu mô tả tiếng Việt.
  - Không có chữ lạ hay hình méo rõ ràng.

### C03 — Tạo 4 ảnh một lần

- **Kết quả:** Đạt · credit dự kiến 24 · ưu tiên cao
- **Cách làm:**
  1. Gõ một prompt bất kỳ, Số lượng 4, bấm Tạo.
- **Mong đợi:**
  - Hiện 4 thẻ riêng, mỗi thẻ 6 credit.
  - Số dư giảm 24.
  - Trang Credit có 4 dòng "Tạo ảnh · Nano Banana 2 · 1K" −6.

### C04 — Ảnh dọc 9:16 và cách hiển thị trong ô

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên trung bình
- **Cách làm:**
  1. Chọn Ratio 9:16, tạo 1 ảnh.
  2. Trên thanh thư viện bấm "Trọn khung" rồi "Lấp đầy".
- **Mong đợi:**
  - Ảnh ra đúng khổ dọc.
  - Trọn khung: thấy trọn ảnh trong ô vuông, hai bên có viền tối.
  - Lấp đầy: ảnh phủ kín ô, bị cắt bớt phần trên và dưới.
- **Ghi chú của người test:** Tôi ko cần chức năng Lấp đầy đâu. Cứ luôn luôn là Trọn khung thôi

### C05 — Tạo ảnh có Reference

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Bấm + Reference, chọn một ảnh JPG hoặc PNG có người hay đồ vật rõ ràng.
  2. Gõ: Đặt nhân vật trong ảnh tham chiếu vào một quán cà phê buổi tối
  3. Bấm Tạo.
- **Mong đợi:**
  - Ảnh tải lên hiện thành chip Reference có ảnh nhỏ.
  - Ảnh kết quả dùng đúng người hoặc đồ vật trong ảnh tham chiếu.
  - Nếu báo lỗi, hoặc ảnh không liên quan gì tới ảnh tham chiếu: chọn Lỗi. Khi đó cách GAIA gửi Reference sang Gommo đang sai.

### C06 — File không hợp lệ cho Reference

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Bấm + Reference. Trong hộp chọn file, đổi bộ lọc sang All files rồi chọn một file GIF hoặc PDF.
- **Mong đợi:**
  - Báo "Chỉ nhận ảnh PNG, JPG hoặc WEBP."
  - Không trừ credit.

### C07 — Đóng tab khi ảnh đang tạo

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Tạo 1 ảnh, bấm Tạo xong thì đóng tab ngay.
  2. Đợi 2 phút rồi mở lại localhost:3000/studio.
- **Mong đợi:**
  - Ảnh có trong thư viện, hoặc chuyển sang có ảnh vài giây sau khi mở.
  - Trang Credit chỉ có một dòng −6, không có dòng hoàn credit.
- **Ghi chú của người test:** Nhưng tôi test thấy hệ thống ko nhận được ảnh Copy, mà chỉ nhận được ảnh có lưu trong máy. Tôi đã thử tìm một ảnh trên Google Images, click chọn "copy image" và qua ô prompt của Gaia, ctrl + V để dán ảnh nhưng Gaia ko nhận được ảnh copy của tôi.

### C08 — Không đủ credit

- **Kết quả:** Chưa test · ưu tiên thấp
- **Cách làm:**
  1. Chỉ làm được khi số dư thấp hơn giá một lần tạo (có thể để sau): chọn thông số có giá lớn hơn số dư.
- **Mong đợi:**
  - Số credit cạnh nút chuyển màu đỏ, nút ghi "Không đủ credit" và không bấm được.
  - Có link "Nạp credit" dẫn sang trang Credit.

## D. Thư viện

### D01 — Lọc theo Ảnh

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Bấm tab Ảnh trên thư viện, rồi bấm Tất cả.
- **Mong đợi:**
  - Tab Ảnh chỉ hiện ảnh, không có video.
  - Tất cả hiện lại mọi thẻ.

### D02 — Nhớ cách hiển thị sau khi tải lại

- **Kết quả:** Lỗi · ưu tiên thấp
- **Cách làm:**
  1. Chọn Lấp đầy, tải lại trang (F5).
- **Mong đợi:**
  - Sau khi tải lại vẫn là Lấp đầy.
- **Ghi chú của người test:** Tôi ko muốn có chức năng Lấp đầy này. Tất cả đều nên là Trọn khung luôn. Tính thẫm mỹ của hệ thống sẽ cao hơn.

### D03 — Dùng lại prompt

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Rê chuột lên một thẻ ảnh, bấm nút bút chì.
- **Mong đợi:**
  - Prompt, model và thông số của ảnh đó được điền vào khung soạn.
  - Không tạo ảnh mới, số dư không đổi.

### D04 — Sao chép prompt

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Bấm ⋯ trên thẻ, chọn Sao chép prompt, rồi dán vào Notepad.
- **Mong đợi:**
  - Thông báo "Đã sao chép prompt".
  - Dán ra đúng prompt của ảnh.

### D05 — Tải ảnh về máy

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Bấm nút tải về trên thẻ.
- **Mong đợi:**
  - Máy tải về một file ảnh mở được, đúng ảnh trên thẻ.

### D06 — Xoá rồi hoàn tác

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Bấm ⋯ trên thẻ, chọn Xoá khỏi thư viện.
  2. Bấm Hoàn tác trên thông báo.
- **Mong đợi:**
  - Thẻ biến mất, thông báo "Đã xoá khỏi thư viện" có nút Hoàn tác.
  - Hoàn tác: thẻ quay lại đúng chỗ cũ.
  - Xoá không hoàn credit: trang Credit không có dòng mới.
- **Ghi chú của người test:** Tôi nghĩ là chức năng xóa rồi hoàn tác này nên chuyển item đó vào "Thùng rác" của hệ thống. Và chỉ khi người dùng vào Thùng rác để xóa thì ảnh/video đó mới thật sự là bị xóa. Tôi đang muốn nói đến thiết kế chức năng Xóa cứng và Xóa mềm đấy.

### D07 — Tải lại trang Studio

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Nhấn F5 ở Studio.
- **Mong đợi:**
  - Thư viện giữ nguyên, các thẻ nằm trong nhóm "Hôm nay".

## E. Chi tiết, sửa ảnh, upscale

### E01 — Trang chi tiết ảnh

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Bấm vào ảnh đã tạo ở C01.
- **Mong đợi:**
  - Ảnh lớn ở giữa, nhãn "Ảnh · 16:9 · Bản gốc".
  - Cột phải: Phiên bản (Bản gốc), Thông tin (Model, Ratio, Resolution, Credit 6, Tạo lúc), Prompt gốc có nút sao chép.
  - Thanh trên: Upscale · từ 5 credit, Tải về, Dùng lại prompt, ⋯.

### E02 — Tạo bản sửa

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên cao
- **Cách làm:**
  1. Ở ô dưới ảnh gõ: Chuyển sang buổi tối, đèn đường vàng ấm
  2. Bấm Tạo bản sửa · 6 credit.
- **Mong đợi:**
  - Có phiên bản mới "Chỉnh sửa 1"; chạy xong thì hiện ảnh.
  - Ảnh sửa giữ bố cục ảnh gốc, chỉ đổi sang buổi tối.
  - Số dư giảm 6; phần Thông tin ghi Credit "6 · tổng 12".
- **Ghi chú của người test:** Nhưng ta ko được chỉnh số lượng ảnh sinh ra của chỉnh sửa à?

### E03 — Sửa tiếp từ một bản sửa

- **Kết quả:** Đạt · credit dự kiến 6 · ưu tiên trung bình
- **Cách làm:**
  1. Chọn "Chỉnh sửa 1" ở cột Phiên bản.
  2. Gõ: Thêm một con mèo nằm trên yên xe, bấm Tạo bản sửa.
- **Mong đợi:**
  - Dòng dưới ô sửa ghi "Sửa từ Chỉnh sửa 1".
  - Có "Chỉnh sửa 2": vẫn là buổi tối, có thêm con mèo.

### E04 — Upscale ảnh

- **Kết quả:** Lỗi · credit dự kiến 8 · ưu tiên cao · kiểm chứng Gommo
- **Cách làm:**
  1. Chọn Bản gốc, bấm Upscale · từ 5 credit.
  2. Chờ đến khi xong (có thể lâu hơn tạo ảnh).
  3. Tải bản Upscale về, xem kích thước ảnh (chuột phải → Properties → Details).
  4. Mở trang Credit.
- **Mong đợi:**
  - Nút đổi thành "Đang upscale…", xong thì có phiên bản "Upscale".
  - Ảnh Upscale lớn hơn bản gốc (bản gốc 1376 × 768).
  - Trang Credit có "Upscale ảnh" −8. Ghi vào ghi chú: có dòng "Hoàn chênh lệch" không. Theo cấu hình hiện tại thì không có (xem Lỗi đã biết).
- **Ghi chú của người test:** Gaia hiện ra "Hệ thống không xử lý được yêu cầu này. Bạn có thể thử lại, hoặc sửa prompt rồi tạo mới."

### E05 — Tải về đúng phiên bản đang xem

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Chọn "Chỉnh sửa 1", bấm Tải về.
- **Mong đợi:**
  - File tải về là ảnh buổi tối (Chỉnh sửa 1), không phải bản gốc.

### E06 — Xoá một phiên bản

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Chọn "Chỉnh sửa 2", bấm ⋯ rồi Xoá phiên bản này.
  2. Chọn Bản gốc rồi mở ⋯.
- **Mong đợi:**
  - Chỉnh sửa 2 biến mất, có thông báo kèm Hoàn tác.
  - Với Bản gốc, menu chỉ có "Xoá cả ảnh khỏi thư viện (N phiên bản)".

### E07 — Thẻ thư viện của ảnh nhiều phiên bản

- **Kết quả:** Chưa test · ưu tiên trung bình
- **Cách làm:**
  1. Quay lại Studio, nhìn thẻ của ảnh vừa sửa.
- **Mong đợi:**
  - Thẻ hiện ảnh của phiên bản mới nhất đã xong.
  - Dòng dưới ghi "Nano Banana 2 · N phiên bản"; số credit là tổng của mọi phiên bản.
- **Ghi chú của người test:** Nên có thêm một icon ký hiệu item có nhiều phiên bản sẽ trực quan - dễ nhận biết hơn. Vì dòng chữ "N phiên bản" có kích thước nhỏ và màu chữ mờ. Dùng icon khác biệt để ghi chú sẽ tốt nhất.

## F. Credit và hoàn tiền

### F01 — Lịch sử giao dịch khớp với thư viện

- **Kết quả:** Đạt · ưu tiên cao
- **Cách làm:**
  1. Mở trang Credit, xem tab Tất cả rồi tab Sử dụng.
- **Mong đợi:**
  - Mỗi lần tạo, sửa, upscale có đúng một dòng trừ: "Tạo ảnh" −6, "Sửa ảnh" −6, "Upscale ảnh" −8.
  - Cột Số dư sau giảm đúng theo từng dòng.
  - Tổng đã trừ bằng tổng credit trên các thẻ trong thư viện.
  - Tab Sử dụng chỉ có các dòng trừ.
- **Ghi chú của người test:** Lịch sử giao dịch nên có thêm chức năng sort theo Mới nhất, Cũ nhất

### F02 — Ảnh lỗi được hoàn credit

- **Kết quả:** Đạt · ưu tiên trung bình
- **Cách làm:**
  1. Chỉ test nếu gặp thẻ "Không tạo được ảnh" trong lúc làm các dòng trên; không gặp thì chọn Bỏ qua.
- **Mong đợi:**
  - Thẻ lỗi ghi "Đã hoàn N credit" và có nút Thử lại · N.
  - Trang Credit có dòng "Hoàn credit" +N, số dư được cộng lại.
- **Ghi chú của người test:** Chức năng upscale bị lỗi, credit được hoàn.

## G. Từ trang chủ vào Studio

### G01 — Gõ prompt ở trang chủ rồi vào Studio (khi đã đăng nhập)

- **Kết quả:** Chưa test · ưu tiên trung bình
- **Cách làm:**
  1. Vẫn đang đăng nhập GAIA. Gõ vào thanh địa chỉ trình duyệt: localhost:3000 rồi nhấn Enter. Đây là trang chủ, không phải /studio.
  2. Ở khung lớn giữa trang chủ (dòng chữ mờ "Mô tả video bạn muốn tạo…"), bấm nút "Ảnh" ở góc trái dưới khung.
  3. Gõ vào khung: Con mèo đen ngồi trên mái ngói
  4. Bấm nút "Tạo" ở góc phải dưới khung.
- **Mong đợi:**
  - Trình duyệt chuyển sang trang Studio.
  - Khung soạn ở cuối trang Studio đã có sẵn câu "Con mèo đen ngồi trên mái ngói" và đang ở chế độ Ảnh.
  - Chưa có ảnh nào được tạo, số dư không đổi. Phải bấm Tạo thêm một lần nữa trong Studio thì mới tạo.
  - Thanh địa chỉ chỉ còn localhost:3000/studio.
- **Ghi chú của người test:** Tôi vẫn chưa hiểu bước thực hiện

### G02 — Gõ prompt ở trang chủ khi chưa đăng nhập

- **Kết quả:** Chưa test · ưu tiên trung bình
- **Cách làm:**
  1. Ở Studio, bấm vòng tròn chữ H ở góc phải trên, chọn Đăng xuất. Bạn được đưa về trang chủ localhost:3000.
  2. Ở khung lớn giữa trang chủ, bấm "Ảnh", gõ: Con mèo đen ngồi trên mái ngói, rồi bấm "Tạo".
  3. Trang đăng nhập hiện ra. Nhìn hộp xám nằm phía trên nút "Tiếp tục với Google".
  4. Bấm "Tiếp tục với Google" và đăng nhập bằng dhnghia.ctu@gmail.com.
- **Mong đợi:**
  - Bước 3: hộp xám ghi "Prompt của bạn sẽ được giữ lại sau khi đăng nhập" và bên dưới là đúng câu con mèo.
  - Đăng nhập xong: vào thẳng Studio, khung soạn có sẵn câu con mèo, chế độ Ảnh, chưa tạo gì.
- **Ghi chú của người test:** Giải thích bước thực hiện rõ hơn giúp

### G03 — Dùng prompt của ảnh mẫu

- **Kết quả:** Đạt · ưu tiên thấp
- **Cách làm:**
  1. Ở trang chủ, mục "Tạo bằng GAIA", bấm "Dùng prompt này" dưới một ảnh.
- **Mong đợi:**
  - Studio mở với đúng prompt đó, chế độ Ảnh.
