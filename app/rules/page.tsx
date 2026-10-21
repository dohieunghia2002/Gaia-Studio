import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { CREDIT_VALIDITY_DAYS } from '@/lib/topup-rules';
import { TRASH_DAYS } from '@/lib/trash';

export const metadata: Metadata = { title: 'Quy ước dùng chung' };

// Trang cho chế độ nhóm riêng (lib/access.ts), thay cho Điều khoản và Bảo mật khi GAIA chưa mở bán.
// Chỉ ghi những gì hệ thống thật sự làm; con số lấy từ code.
export default function RulesPage() {
  return (
    <LegalPage title="Quy ước dùng chung" updatedAt="21/10/2026" draft={false}>
      <p>
        GAIA hiện chỉ dành cho một nhóm nhỏ do chủ nhóm mời. GAIA không bán credit và không thu tiền trên web. Khi đăng nhập,
        bạn đồng ý với các quy ước dưới đây.
      </p>

      <h2>1. Tài khoản</h2>
      <ul>
        <li>Bạn đăng nhập bằng tài khoản Google có email đã được mời. Email chưa được mời không vào được.</li>
        <li>Không cho người ngoài nhóm dùng tài khoản của bạn.</li>
      </ul>

      <h2>2. Credit</h2>
      <ul>
        <li>Credit do chủ nhóm cấp. Khi cần thêm, bạn nhắn chủ nhóm.</li>
        <li>Credit có hạn {CREDIT_VALIDITY_DAYS} ngày kể từ ngày cấp. Credit sắp hết hạn được dùng trước.</li>
        <li>Giá của mỗi lượt tạo hiện trên nút Tạo trước khi bạn bấm. GAIA trừ đúng số credit đó.</li>
        <li>Lượt tạo không thành công được tự động hoàn đủ credit. Lượt tạo thành công vẫn tính credit, kể cả khi kết quả chưa đúng ý bạn.</li>
      </ul>

      <h2>3. Nội dung không được tạo</h2>
      <p>Bạn không dùng GAIA để tạo hoặc tải lên:</p>
      <ul>
        <li>Nội dung trái pháp luật Việt Nam.</li>
        <li>Bất kỳ nội dung tình dục hoặc xâm hại nào liên quan đến trẻ em.</li>
        <li>Nội dung khiêu dâm, bạo lực cực đoan, kích động thù ghét.</li>
        <li>Hình ảnh hoặc video giả mạo người thật để lừa đảo, bôi nhọ, hoặc khi chưa có sự đồng ý của người đó.</li>
        <li>Nội dung xâm phạm bản quyền, nhãn hiệu hoặc quyền riêng tư của người khác.</li>
      </ul>
      <p>
        Khi đăng lên mạng ảnh hoặc video trông giống người thật hay sự kiện có thật, bạn ghi rõ đó là nội dung do AI tạo. Các mô
        hình AI có bộ lọc riêng và có thể từ chối yêu cầu. Chủ nhóm có thể gỡ quyền dùng GAIA của tài khoản vi phạm.
      </p>

      <h2>4. Dữ liệu GAIA lưu</h2>
      <ul>
        <li>Từ tài khoản Google: email, tên và ảnh đại diện.</li>
        <li>Thư viện của bạn (prompt, thông số, đường dẫn tới ảnh và video) và lịch sử credit, lưu trên Supabase.</li>
        <li>
          Prompt và ảnh bạn tải lên được gửi tới nhà cung cấp mô hình AI để tạo kết quả. Ảnh tải lên, cùng ảnh và video tạo ra,
          nằm trên máy chủ của nhà cung cấp. Prompt video tiếng Việt có thể được tự động dịch sang tiếng Anh trước khi gửi.
        </li>
        <li>
          Mục trong Thùng rác tự xoá vĩnh viễn sau {TRASH_DAYS} ngày. Xoá vĩnh viễn xoá mục đó khỏi GAIA, nhưng tệp trên máy chủ
          của nhà cung cấp không xoá được, nên đường dẫn bạn đã chia sẻ có thể vẫn mở được.
        </li>
        <li>Muốn xoá tài khoản và dữ liệu của bạn, bạn nhắn chủ nhóm.</li>
      </ul>
      <p>GAIA không bán dữ liệu của bạn và không dùng dữ liệu của bạn để quảng cáo.</p>

      <h2>5. Gián đoạn</h2>
      <p>
        GAIA có thể tạm dừng tạo mới hoặc tạm ẩn một mô hình khi bảo trì hoặc khi nhà cung cấp gặp sự cố. Khi tạm dừng, credit
        của bạn không bị trừ.
      </p>
    </LegalPage>
  );
}
