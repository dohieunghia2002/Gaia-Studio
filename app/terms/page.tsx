import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';
import { fmtVnd } from '@/lib/format';
import { CREDIT_VALIDITY_DAYS, MAX_TOPUP_VND, MIN_TOPUP_VND } from '@/lib/topup-rules';
import { TRASH_DAYS } from '@/lib/trash';

export const metadata: Metadata = { title: 'Điều khoản sử dụng' };

// Mọi con số lấy từ code đang chạy (topup-rules, trash) để trang không nói khác hệ thống.
export default function TermsPage() {
  return (
    <LegalPage title="Điều khoản sử dụng">
      <p>
        GAIA Studio (&ldquo;GAIA&rdquo;) là dịch vụ tạo ảnh và video bằng AI, do <strong>{LEGAL.operator}</strong> vận hành.
        Khi đăng nhập và sử dụng GAIA, bạn đồng ý với các điều khoản dưới đây.
      </p>

      <h2>1. Tài khoản</h2>
      <ul>
        <li>Bạn đăng nhập bằng tài khoản Google. Bạn tự giữ an toàn cho tài khoản Google của mình.</li>
        <li>Bạn cần từ <strong>{LEGAL.minAge}</strong> tuổi trở lên để sử dụng GAIA.</li>
        <li>Mỗi tài khoản có một ví credit riêng, không chuyển cho người khác.</li>
      </ul>

      <h2>2. Credit và nạp tiền</h2>
      <ul>
        <li>1.000đ = 10 credit. Mỗi lần nạp từ {fmtVnd(MIN_TOPUP_VND)} đến {fmtVnd(MAX_TOPUP_VND)}, là bội số của 1.000đ.</li>
        <li>Nạp từ 200.000đ được thưởng 5% credit, từ 500.000đ được thưởng 10%.</li>
        <li>Credit có hạn {CREDIT_VALIDITY_DAYS} ngày kể từ ngày nạp. Credit sắp hết hạn được dùng trước. Credit hết hạn không còn dùng được.</li>
        <li>Nạp tiền bằng chuyển khoản ngân hàng hoặc mã QR qua cổng thanh toán PayOS. Credit được cộng khi giao dịch được xác nhận.</li>
        <li>Giá của mỗi lượt tạo hiện trên nút Tạo trước khi bạn bấm. GAIA không trừ khác số credit đã hiện.</li>
      </ul>

      <h2>3. Hoàn credit và hoàn tiền</h2>
      <ul>
        <li>Lượt tạo không thành công (lỗi hệ thống, quá thời gian chờ, bị bộ lọc nội dung từ chối) được tự động hoàn đủ credit vào ví.</li>
        <li>Lượt tạo thành công vẫn tính credit, kể cả khi kết quả chưa đúng ý bạn.</li>
        <li><strong>[Chính sách hoàn tiền mặt cho credit chưa dùng: cần chốt, ví dụ không quy đổi lại thành tiền trừ khi GAIA ngừng dịch vụ.]</strong></li>
      </ul>

      <h2>4. Nội dung bạn tải lên và tạo ra</h2>
      <ul>
        <li>Bạn chịu trách nhiệm về prompt và ảnh bạn tải lên, và phải có quyền sử dụng các ảnh đó.</li>
        <li><strong>[Quyền sử dụng ảnh và video tạo ra: cần chốt, có tính đến điều khoản của các mô hình AI mà GAIA dùng.]</strong></li>
        <li>Kết quả do AI tạo có thể không đúng hoàn toàn với mô tả. GAIA không bảo đảm kết quả phù hợp cho mọi mục đích.</li>
      </ul>

      <h2>5. Nội dung không được tạo</h2>
      <p>Bạn không dùng GAIA để tạo hoặc tải lên:</p>
      <ul>
        <li>Nội dung trái pháp luật Việt Nam.</li>
        <li>Bất kỳ nội dung tình dục hoặc xâm hại nào liên quan đến trẻ em.</li>
        <li>Nội dung khiêu dâm, bạo lực cực đoan, kích động thù ghét.</li>
        <li>Hình ảnh hoặc video giả mạo người thật để lừa đảo, bôi nhọ, hoặc khi chưa có sự đồng ý của người đó.</li>
        <li>Nội dung xâm phạm bản quyền, nhãn hiệu hoặc quyền riêng tư của người khác.</li>
      </ul>
      <p>Các mô hình AI có bộ lọc riêng và có thể từ chối yêu cầu. GAIA có thể khoá tài khoản vi phạm.</p>

      <h2>6. Lưu trữ và xoá</h2>
      <ul>
        <li>Ảnh và video bạn tạo được lưu trong thư viện của bạn.</li>
        <li>Mục chuyển vào Thùng rác tự xoá vĩnh viễn sau {TRASH_DAYS} ngày. Bạn có thể khôi phục trước thời hạn đó.</li>
        <li>
          Xoá vĩnh viễn xoá mục đó khỏi GAIA. Tệp ảnh và video được lưu trên máy chủ của nhà cung cấp mô hình AI, nên
          đường dẫn bạn đã chia sẻ trước đó có thể vẫn mở được.
        </li>
      </ul>

      <h2>7. Gián đoạn dịch vụ</h2>
      <p>
        GAIA có thể tạm dừng tạo mới hoặc tạm ẩn một mô hình khi bảo trì hoặc khi nhà cung cấp gặp sự cố. Khi tạm dừng, credit
        của bạn không bị trừ.
      </p>

      <h2>8. Thay đổi và liên hệ</h2>
      <p>
        GAIA có thể cập nhật điều khoản này và sẽ ghi ngày cập nhật ở đầu trang. Liên hệ: <strong>{LEGAL.contactEmail}</strong>. Xem thêm{' '}
        <Link href="/privacy">Chính sách bảo mật</Link>.
      </p>
    </LegalPage>
  );
}
