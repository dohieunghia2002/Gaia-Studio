// Next gọi `register` một lần khi server khởi động, trước request đầu tiên.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // fetch của Node mặc định đóng kết nối rảnh sau 4 giây. Người dùng chuyển trang thường cách nhau lâu hơn thế, nên
  // gần như lần nào server cũng phải mở lại kết nối HTTPS tới Supabase/Gommo: thêm ~3 lượt đi-về, tức ~0,5 giây
  // mỗi trang từ máy dev ở VN (đo 2026-10-12: /credit 390 ms khi kết nối còn mở, 850 ms sau khi nghỉ 6 giây).
  // Giữ kết nối rảnh 30 giây. undici là thư viện fetch của chính Node, nên dispatcher này áp dụng cho mọi fetch.
  const { Agent, setGlobalDispatcher } = await import('undici');
  setGlobalDispatcher(new Agent({ keepAliveTimeout: 30_000, keepAliveMaxTimeout: 60_000 }));
}
