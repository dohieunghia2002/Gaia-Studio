import type { Kind } from './types';

// Ý tưởng prompt cho màn Studio lần đầu. GAIA tự soạn (API gợi ý của Gommo hiện trả rỗng),
// nên không gắn nhãn nguồn như "Midjourney". Sửa/thêm thoải mái.

export interface Suggestion {
  kind: Kind;
  prompt: string;
  tone: string; // màu nền ô minh hoạ
}

export const SUGGESTIONS: Suggestion[] = [
  { kind: 'image', prompt: 'Rừng tre mờ sương lúc bình minh, tia nắng xuyên qua lá, góc rộng điện ảnh', tone: '#2B3330' },
  { kind: 'video', prompt: 'Chiếc thuyền giấy trôi trên con phố ngập nước mưa, chuyển động chậm, phản chiếu ánh đèn', tone: '#263238' },
  { kind: 'image', prompt: 'Chân dung ông lão thợ mộc trong xưởng, ánh sáng cửa sổ ấm, ống kính 85mm', tone: '#3D3129' },
  { kind: 'video', prompt: 'Đèn hoa đăng trôi trên sông Hoài về đêm, máy quay tiến chậm về phía trước', tone: '#35293A' },
  { kind: 'image', prompt: 'Ảnh sản phẩm tối giản: chiếc cốc gốm đặt trên vải lanh, ánh sáng mềm từ trên, tông be', tone: '#3E3A2B' },
  { kind: 'video', prompt: 'Sóng biển đánh vào ghềnh đá đen, flycam bay vòng chậm, giờ vàng', tone: '#2E3B36' },
  { kind: 'image', prompt: 'Phố cổ Hội An về đêm, đèn lồng đỏ, mưa phùn, góc máy thấp, phong cách phim 35mm', tone: '#3A2A2A' },
  { kind: 'video', prompt: 'Flycam bay qua ruộng bậc thang Mù Cang Chải lúc bình minh, sương mỏng phủ thung lũng', tone: '#2F3527' },
  { kind: 'image', prompt: 'Một tô phở bò bốc khói trên bàn gỗ, ánh sáng studio, cận cảnh, chi tiết sắc nét', tone: '#3B3226' },
  { kind: 'video', prompt: 'Cô gái mặc áo dài trắng đạp xe qua con đường lá vàng rơi, máy quay lia theo', tone: '#3A3327' },
  { kind: 'image', prompt: 'Logo tối giản hình ngọn núi và mặt trời, nét mảnh, nền trắng, phong cách phẳng', tone: '#2D3142' },
  { kind: 'video', prompt: 'Ly cà phê sữa đá, sữa đặc chảy chậm hoà vào cà phê, cận cảnh, chuyển động chậm', tone: '#33291F' },
  { kind: 'image', prompt: 'Căn phòng làm việc ấm cúng ngày mưa, cây xanh, đèn bàn vàng, phong cách minh hoạ', tone: '#2C2A33' },
  { kind: 'video', prompt: 'Thành phố tương lai về đêm, xe bay lướt giữa các toà nhà neon, góc máy từ trên cao', tone: '#252B3A' },
  { kind: 'image', prompt: 'Con mèo cam ngủ trên bậu cửa sổ, nắng chiều, bụi bay trong nắng, phong cách phim', tone: '#3D3129' },
  { kind: 'video', prompt: 'Bánh xèo đổ vào chảo nóng, dầu sôi lăn tăn, cận cảnh trên bếp, chuyển động chậm', tone: '#3B3424' },
  { kind: 'image', prompt: 'Phi hành gia đứng giữa cánh đồng hoa cải vàng, bầu trời trong, ảnh siêu thực', tone: '#363324' },
  { kind: 'video', prompt: 'Hạt mưa rơi trên mặt hồ sen, tiếng mưa nhẹ, máy quay tĩnh, cận cảnh', tone: '#26332E' },
];

export const SUGGESTION_PAGE = 6;
