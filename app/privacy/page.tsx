import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';
import { TRASH_DAYS } from '@/lib/trash';

export const metadata: Metadata = { title: 'Chính sách bảo mật' };

// Chỉ ghi những gì hệ thống thật sự làm (bảng profiles, generations, payments; Supabase, Google, PayOS, nhà cung cấp AI).
export default function PrivacyPage() {
  return (
    <LegalPage title="Chính sách bảo mật">
      <p>
        Trang này cho biết GAIA thu thập dữ liệu gì, dùng để làm gì và chia sẻ với ai. GAIA do <strong>{LEGAL.operator}</strong> vận
        hành và xử lý dữ liệu cá nhân theo quy định của pháp luật Việt Nam.
      </p>

      <h2>1. Dữ liệu GAIA thu thập</h2>
      <ul>
        <li>Từ tài khoản Google khi bạn đăng nhập: địa chỉ email, tên và ảnh đại diện.</li>
        <li>Do bạn cung cấp: prompt, và ảnh bạn tải lên (ảnh Reference, Start frame, End frame, ảnh cần sửa).</li>
        <li>Do GAIA tạo ra cho bạn: ảnh, video, các phiên bản sửa, lịch sử credit.</li>
        <li>
          Khi bạn nạp tiền: mã đơn, số tiền, thời điểm, và dữ liệu giao dịch PayOS gửi về khi nhận được tiền, có thể gồm tên
          và số tài khoản ngân hàng người chuyển. GAIA không nhận và không lưu mật khẩu, mã OTP hay thông tin đăng nhập ngân hàng.
        </li>
        <li>Dữ liệu kỹ thuật: cookie giữ phiên đăng nhập (cần thiết để GAIA hoạt động) và nhật ký máy chủ.</li>
      </ul>

      <h2>2. Mục đích sử dụng</h2>
      <ul>
        <li>Đăng nhập và giữ phiên đăng nhập.</li>
        <li>Tạo ảnh và video theo yêu cầu của bạn, lưu kết quả vào thư viện.</li>
        <li>Tính, trừ và hoàn credit. Xử lý và đối soát giao dịch nạp tiền.</li>
        <li>Hỗ trợ bạn, phát hiện và ngăn chặn lạm dụng.</li>
      </ul>
      <p>GAIA không bán dữ liệu của bạn và không dùng dữ liệu của bạn để quảng cáo.</p>

      <h2>3. Bên thứ ba xử lý dữ liệu cho GAIA</h2>
      <ul>
        <li>Supabase: lưu tài khoản, thư viện, lịch sử credit và giao dịch.</li>
        <li>Google: xác thực đăng nhập.</li>
        <li>
          Nhà cung cấp mô hình AI: nhận prompt và ảnh bạn gửi kèm để tạo kết quả. Ảnh và video tạo ra được lưu trên máy chủ
          của nhà cung cấp. Prompt tiếng Việt có thể được tự động dịch sang tiếng Anh trước khi tạo.
        </li>
        <li>PayOS: xử lý thanh toán khi bạn nạp tiền.</li>
      </ul>

      <h2>4. Thời gian lưu</h2>
      <ul>
        <li>Dữ liệu tài khoản và thư viện được lưu khi tài khoản còn hoạt động.</li>
        <li>Mục trong Thùng rác tự xoá vĩnh viễn khỏi GAIA sau {TRASH_DAYS} ngày.</li>
        <li><strong>[Thời gian lưu dữ liệu giao dịch để đối soát: cần chốt.]</strong></li>
      </ul>

      <h2>5. Quyền của bạn</h2>
      <ul>
        <li>Xem, tải về và xoá ảnh, video trong thư viện của bạn bất cứ lúc nào.</li>
        <li>
          Yêu cầu xem, sửa hoặc xoá dữ liệu cá nhân, hoặc xoá tài khoản, bằng cách gửi email tới <strong>{LEGAL.contactEmail}</strong>.
        </li>
        <li>Khi xoá tài khoản, credit còn lại trong ví không còn dùng được.</li>
      </ul>

      <h2>6. Bảo vệ dữ liệu</h2>
      <p>
        Dữ liệu được truyền qua kết nối mã hoá (HTTPS). Mỗi tài khoản chỉ truy cập được dữ liệu của chính mình. Không hệ thống
        nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng đến dữ liệu của bạn, GAIA sẽ thông báo cho bạn.
      </p>

      <h2>7. Liên hệ</h2>
      <p>
        Câu hỏi về dữ liệu cá nhân: <strong>{LEGAL.contactEmail}</strong>. Xem thêm <Link href="/terms">Điều khoản sử dụng</Link>.
      </p>
    </LegalPage>
  );
}
