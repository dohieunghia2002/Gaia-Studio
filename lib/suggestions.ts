import type { Kind } from './types';

// Ý tưởng prompt cho màn Studio lần đầu và trang chủ. GAIA tự soạn (API gợi ý của Gommo hiện trả rỗng),
// nên không gắn nhãn nguồn như "Midjourney". Sửa/thêm thoải mái.
//
// `sample` chỉ điền khi đã có kết quả THẬT tạo bằng GAIA từ đúng prompt đó (file đặt trong public/samples/).
// Có sample thì thẻ gợi ý hiện ảnh/video, và trang chủ hiện nó ở mục "Tạo bằng GAIA".
// Không có thì thẻ chỉ hiện chữ — không dùng ô màu hay ảnh minh hoạ giả.

export interface Suggestion {
  kind: Kind;
  prompt: string;
  sample?: {
    src: string; // ảnh, hoặc file video .mp4
    poster?: string; // ảnh đại diện cho video
    model: string; // tên model đã dùng, đúng như trong danh sách model
    ratio: string; // vd "16:9"
    duration?: number; // giây, cho video
  };
}

export type SuggestionWithSample = Suggestion & { sample: NonNullable<Suggestion['sample']> };

export function hasSample(s: Suggestion): s is SuggestionWithSample {
  return Boolean(s.sample);
}

export const SUGGESTIONS: Suggestion[] = [
  {
    kind: 'image',
    prompt: 'Rừng tre mờ sương lúc bình minh, tia nắng xuyên qua lá, góc rộng điện ảnh',
    sample: { src: '/samples/rung-tre.webp', model: 'Nano Banana 2', ratio: '16:9' },
  },
  {
    kind: 'video',
    prompt: 'Chiếc thuyền giấy trôi trên con phố ngập nước mưa, chuyển động chậm, phản chiếu ánh đèn',
    sample: { src: '/samples/thuyen-giay.mp4', poster: '/samples/thuyen-giay-poster.webp', model: 'VEO 3.1', ratio: '16:9', duration: 8 },
  },
  {
    kind: 'image',
    prompt: 'Chân dung ông lão thợ mộc trong xưởng, ánh sáng cửa sổ ấm, ống kính 85mm',
    sample: { src: '/samples/ong-lao-tho-moc.webp', model: 'Nano Banana 2', ratio: '16:9' },
  },
  {
    kind: 'video',
    prompt: 'Đèn hoa đăng trôi trên sông Hoài về đêm, máy quay tiến chậm về phía trước',
    sample: { src: '/samples/den-hoa-dang.mp4', poster: '/samples/den-hoa-dang-poster.webp', model: 'VEO 3.1', ratio: '16:9', duration: 8 },
  },
  {
    kind: 'image',
    prompt: 'Ảnh sản phẩm tối giản: chiếc cốc gốm đặt trên vải lanh, ánh sáng mềm từ trên, tông be',
    sample: { src: '/samples/coc-gom.webp', model: 'Nano Banana 2', ratio: '16:9' },
  },
  {
    kind: 'video',
    prompt: 'Sóng biển đánh vào ghềnh đá đen, flycam bay vòng chậm, giờ vàng',
    sample: { src: '/samples/song-bien.mp4', poster: '/samples/song-bien-poster.webp', model: 'VEO 3.1', ratio: '16:9', duration: 8 },
  },
  {
    kind: 'image',
    prompt: 'Phố cổ Hội An về đêm, đèn lồng đỏ, mưa phùn, góc máy thấp, phong cách phim 35mm',
    sample: { src: '/samples/hoi-an.webp', model: 'Nano Banana 2', ratio: '16:9' },
  },
  { kind: 'video', prompt: 'Flycam bay qua ruộng bậc thang Mù Cang Chải lúc bình minh, sương mỏng phủ thung lũng' },
  {
    kind: 'image',
    prompt: 'Một tô phở bò bốc khói trên bàn gỗ, ánh sáng studio, cận cảnh, chi tiết sắc nét',
    sample: { src: '/samples/pho-bo.webp', model: 'Nano Banana 2', ratio: '16:9' },
  },
  { kind: 'video', prompt: 'Cô gái mặc áo dài trắng đạp xe qua con đường lá vàng rơi, máy quay lia theo' },
  { kind: 'image', prompt: 'Logo tối giản hình ngọn núi và mặt trời, nét mảnh, nền trắng, phong cách phẳng' },
  {
    kind: 'video',
    prompt: 'Ly cà phê sữa đá, sữa đặc chảy chậm hoà vào cà phê, cận cảnh, chuyển động chậm',
    sample: { src: '/samples/ca-phe-sua-da.mp4', poster: '/samples/ca-phe-sua-da-poster.webp', model: 'VEO 3.1', ratio: '16:9', duration: 8 },
  },
  { kind: 'image', prompt: 'Căn phòng làm việc ấm cúng ngày mưa, cây xanh, đèn bàn vàng, phong cách minh hoạ' },
  { kind: 'video', prompt: 'Thành phố tương lai về đêm, xe bay lướt giữa các toà nhà neon, góc máy từ trên cao' },
  { kind: 'image', prompt: 'Con mèo cam ngủ trên bậu cửa sổ, nắng chiều, bụi bay trong nắng, phong cách phim' },
  { kind: 'video', prompt: 'Bánh xèo đổ vào chảo nóng, dầu sôi lăn tăn, cận cảnh trên bếp, chuyển động chậm' },
  { kind: 'image', prompt: 'Phi hành gia đứng giữa cánh đồng hoa cải vàng, bầu trời trong, ảnh siêu thực' },
  { kind: 'video', prompt: 'Hạt mưa rơi trên mặt hồ sen, tiếng mưa nhẹ, máy quay tĩnh, cận cảnh' },
];

export const SUGGESTION_PAGE = 6;

/** Mở Studio với prompt điền sẵn trong khung soạn (chưa đăng nhập thì đi qua trang đăng nhập, prompt vẫn giữ). */
export function promptHref(kind: Kind, prompt: string): string {
  return `/studio?${new URLSearchParams({ kind, prompt })}`;
}

/** Tỉ lệ "16:9" → 16/9; sai định dạng thì 1. */
export function ratioValue(ratio: string): number {
  const [w, h] = ratio.split(/[:_x]/).map(Number);
  return w > 0 && h > 0 ? w / h : 1;
}
