import 'server-only';
import { gommoPost } from './gommo';
import type { CatalogModel, Kind, Option, PriceRow } from './types';
import { formatOptionValue, ratioLabel } from './catalog';

// ── Giá GAIA ──
// credit GAIA = ceil(credit Gommo × giá vốn mỗi credit Gommo (đ) × hệ số lời ÷ 100đ)
// Mặc định: ~1đ/credit Gommo qua 79ai, lời 50% → VEO 3.1 Lite 720p (800) = 12 credit.

function costPerGommoCredit(): number {
  const v = Number(process.env.GAIA_COST_PER_GOMMO_CREDIT ?? 1);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function markup(): number {
  const v = Number(process.env.GAIA_MARKUP ?? 1.5);
  return Number.isFinite(v) && v >= 1 ? v : 1.5;
}

export function gaiaCredits(gommoCredits: number): number {
  if (!Number.isFinite(gommoCredits) || gommoCredits <= 0) return 0;
  return Math.ceil((gommoCredits * costPerGommoCredit() * markup()) / 100);
}

/** Chiều ngược của gaiaCredits: credit Gommo tối đa một mức giá GAIA có thể tốn (làm tròn lên). */
export function gommoCreditsFor(gaia: number): number {
  if (!Number.isFinite(gaia) || gaia <= 0) return 0;
  return Math.ceil((gaia * 100) / (costPerGommoCredit() * markup()));
}

// ── Danh mục ──

/**
 * Danh sách trắng (18/10/2026): GAIA chỉ bán model đã tạo thử thành công qua GAIA. Model Gommo mới thêm, hay model
 * đang lỗi, không có ở đây thì bị ẩn hẳn. Chức năng phụ cũng chỉ bật khi đã kiểm chứng trên chính model đó, bằng
 * mắt chứ không chỉ nhìn status (có model báo thành công nhưng bỏ qua ảnh gửi kèm):
 * - `refs`: tạo ảnh từ ảnh Reference (thử với 3 ảnh); `edit`: sửa ảnh (giữ cảnh, chỉ đổi phần được yêu cầu);
 * - `start`: video bắt đầu đúng từ Start frame; `end`: video kết thúc đúng ở End frame.
 * Thêm model: tạo thử qua GAIA từng chức năng rồi ghi vào đây. Kết quả và lý do loại từng model:
 * docs/qa/kiem-thu-model-2026-10-16.md.
 */
type Verified = { refs?: true; edit?: true; start?: true; end?: true };
export const VERIFIED_MODELS: Record<string, Verified> = {
  // Ảnh
  google_image_gen_banana_2: { refs: true, edit: true },
  google_image_gen_banana_pro: { refs: true, edit: true },
  google_image_gen_banana: { refs: true, edit: true },
  imagegen_2_0: { refs: true, edit: true },
  'gpt-image-2.5-flare': { refs: true, edit: true },
  'gpt-image-2.5-sunburst': { refs: true, edit: true },
  '3.0-omni': { refs: true, edit: true },
  o1: { refs: true, edit: true },
  z_image: {}, // sửa ảnh: vẽ ảnh mới, bỏ qua ảnh gốc
  kling_colors_1_5: {}, // sửa ảnh: vẽ ảnh mới, bỏ qua ảnh gốc
  kling_colors_2_0: { refs: true }, // sửa ảnh: "Không thể hoàn thành #rq11"
  kling_colors_2_1: {}, // sửa ảnh: vẽ ảnh mới, bỏ qua ảnh gốc
  // Video
  veo_3_1: { start: true, end: true },
  kling_video_2_5: { start: true, end: true },
  kling_4_0: { start: true, end: true },
  kling_4_0_flash: { start: true },
  kling_video_2_6: { start: true },
  seedance_20_pro: { start: true, end: true },
  seedance_20_mini: {},
  seedance_25_omni: {},
  seedance_20_pro_edit: {},
  grok_video_heavy: { start: true },
  wan_3_0: {}, // Start/End frame: Gommo nhận ảnh nhưng video ra cảnh khác (mode cheap và vip)
  // Founder bỏ sau khi xem video mẫu (18/10/2026): meta_muse_video (Start frame đúng 2/3, End sai 2/2),
  // veo_omni (Start frame lỗi 2/2).
};

/**
 * Model video bắt buộc có Start frame dù Gommo báo `startText: true`. Gommo không có cờ nào cho biết điều này,
 * chỉ biết khi gửi thử (bị từ chối ngay, không trừ tiền):
 * - kling_video_2_5 (mode relax): "Model Kling 2.5 yêu cầu tối thiểu 1 ảnh tham chiếu" (2026-10-11);
 * - hailuo_2_3: "Model Hailuo 2.3 cần ảnh tham chiếu khung hình đầu" (2026-10-16);
 * - kling_video_2_1_5s, kling_video_2_1_10s: "Vui lòng đính kèm ảnh." (2026-10-16).
 */
export const START_FRAME_REQUIRED: string[] = ['kling_video_2_5', 'hailuo_2_3', 'kling_video_2_1_5s', 'kling_video_2_1_10s'];

/**
 * Model chỉ bán được một số mode, dù Gommo liệt kê thêm mode khác. google_image_gen_banana_pro: relaxed và
 * standard bị từ chối ngay, không trừ tiền: "Chế độ Relaxed và Standard hiện không khả dụng vui lòng chọn các
 * chế độ VIP" (2026-10-16).
 */
export const ALLOWED_MODES: Record<string, string[]> = {
  google_image_gen_banana_pro: ['vip', 'vip2', 'vip3'],
  // Founder ẩn mode "Spicy" (extremely-spicy-or-crazy) để tránh nội dung nhạy cảm (18/10/2026) và mode "Fun"
  // (extremely-crazy), vì nó tự chèn nhân vật hoạt hình vào cảnh (19/10/2026).
  grok_video_heavy: ['normal', 'custom'],
};

/**
 * Model chỉ nhận Start + End frame ở một số mode, dù Gommo báo `startImageAndEnd: true` và không ghi giới hạn này.
 * kling_video_2_5 mode relax bị từ chối ngay, không trừ tiền: "Tạo video từ khung hình đầu và cuối chỉ hoạt động ở
 * chế độ Professional" (2026-10-12).
 */
export const END_FRAME_MODES: Record<string, string[]> = { kling_video_2_5: ['professional'] };

/**
 * Tạm chỉ bán phạm vi thông số đã tạo thử thành công qua GAIA (founder chọn 18/10/2026): mode và độ phân giải đã
 * thử, thời lượng trong khoảng [ngắn nhất, dài nhất] đã thử. Thử thêm thì nới ra ở đây. `exclude` chặn tổ hợp Gommo
 * có liệt kê giá nhưng chạy lỗi. Model không có ở đây thì bán đủ như Gommo liệt kê (hiện là các model ảnh).
 * Kết quả từng lượt: docs/qa/kiem-thu-model-2026-10-16.md.
 */
type TestedRange = {
  modes?: string[];
  resolutions?: string[];
  durations?: [number, number];
  exclude?: (row: { mode?: string; resolution?: string; duration?: string }) => boolean;
};
export const TESTED_RANGE: Record<string, TestedRange> = {
  // 4 giây: "Thời lượng 4s không khả dụng #vid_duration_unavailable" (lite 4K, 18/10). 4K chưa thử.
  veo_3_1: { resolutions: ['720p', '1080p'], durations: [6, 8] },
  // Relax 10 giây bị từ chối ngay: "Model Kling 2.5 Relax chỉ hỗ trợ thời lượng 5s" (18/10). 10 giây chưa thử ở mode khác.
  kling_video_2_5: { durations: [5, 5], exclude: (r) => r.mode === 'relax' && r.duration === '10' },
  kling_video_2_6: { modes: ['standard', 'professional_audio'], durations: [5, 5] },
  wan_3_0: { modes: ['cheap', 'vip'], resolutions: ['480p'], durations: [4, 10] },
  seedance_20_pro: { modes: ['fast', 'professional'], resolutions: ['480p', '720p'], durations: [4, 4] },
  grok_video_heavy: { durations: [6, 15] },
  kling_4_0: { resolutions: ['720p', '1080p'], durations: [3, 10] },
  kling_4_0_flash: { durations: [3, 3] },
  // Founder giữ nhưng không thử sâu: chỉ bán đúng cấu hình đã tạo thử.
  seedance_20_mini: { modes: ['business_mini_vip'], resolutions: ['480p'], durations: [4, 4] },
  seedance_25_omni: { modes: ['business_professional_vip'], resolutions: ['480p'], durations: [4, 4] },
  seedance_20_pro_edit: { modes: ['business_fast'], resolutions: ['720p'], durations: [4, 4] },
};

function inRange(range: TestedRange | undefined, field: 'mode' | 'resolution' | 'duration', value: string): boolean {
  if (!range) return true;
  if (field === 'mode') return !range.modes || range.modes.includes(value);
  if (field === 'resolution') return !range.resolutions || range.resolutions.includes(value);
  const n = Number(value);
  return !range.durations || (n >= range.durations[0] && n <= range.durations[1]);
}

/** Model hiện trên trang chủ, theo thứ tự. Model nào không còn thì bỏ qua. */
export const FEATURED_MODELS = ['veo_3_1', 'kling_video_2_5', 'wan_3_0', 'google_image_gen_banana_2'];

/**
 * Thứ tự trong danh sách chọn model; model đầu tiên còn dùng được là mặc định.
 * Model không có trong danh sách này xếp sau, giữ thứ tự của Gommo.
 */
export const MODEL_ORDER: Record<Kind, string[]> = {
  video: [
    'veo_3_1', 'kling_video_2_5', 'kling_video_3_0', 'kling_video_2_6', 'kling_video_o1', 'wan_3_0', 'hailuo_2_3',
    'seedance_20_pro', 'seedance_20_mini', 'seedance_25_omni', 'grok_video_heavy', 'gemini_omni_flash_1_1', 'veo_omni',
    'minimax_h3', 'minimax_h3_max', 'happy_horse_1', 'flux_3',
  ],
  image: [
    'google_image_gen_banana_2', 'google_image_gen_banana_pro', 'gemini-nano-banana-2.1', 'imagegen_2_0',
    'gpt-image-2.5-flare', 'gpt-image-2.5-sunburst', 'midjourney_8_2', 'midjourney_8_0', 'seedream-5-0-pro',
    'seedream-5-0-flash', 'seedream_5_0', 'seedream_4_5', 'flux-3-image', 'ideogram-4-5',
  ],
};

function byPreferredOrder(kind: Kind, models: CatalogModel[]): CatalogModel[] {
  const rank = (id: string) => {
    const i = MODEL_ORDER[kind].indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return models
    .map((m, i) => ({ m, i }))
    .sort((a, b) => rank(a.m.id) - rank(b.m.id) || a.i - b.i)
    .map((x) => x.m);
}

type RawOption = { name?: string; type?: string | number; status?: string; price?: number };
type RawModel = Record<string, unknown> & {
  name?: string;
  model?: string;
  status?: string;
  price?: number;
  ratios?: RawOption[];
  resolutions?: RawOption[];
  durations?: RawOption[];
  modes?: RawOption[];
  mode?: RawOption[];
  prices?: { mode?: string; resolution?: string; duration?: string | number; price?: number }[];
};

function options(raw: RawOption[] | undefined, field: 'ratio' | 'resolution' | 'duration'): Option[] {
  return (raw ?? [])
    .filter((o) => o.type !== undefined && o.type !== null && o.type !== '' && o.status !== 'off')
    .map((o) => {
      const value = String(o.type);
      return { value, label: field === 'ratio' ? ratioLabel(value) : formatOptionValue(field, value) };
    });
}

function modeOptions(raw: RawOption[] | undefined): Option[] {
  return (raw ?? [])
    .filter((o) => o.type && o.status !== 'off')
    .map((o) => ({ value: String(o.type), label: String(o.name || o.type) }));
}

function isUsableVideo(m: RawModel): boolean {
  return (
    m.startText === true &&
    !m.withEdit &&
    !m.withLipsync &&
    !m.withMotion &&
    !m.withUpscale &&
    m.rate_type !== 'per_second'
  );
}

function isUsableImage(m: RawModel): boolean {
  // Model upscale chỉ có ratio "auto" → không dùng để tạo ảnh từ prompt.
  const ratios = (m.ratios ?? []).map((r) => String(r.type));
  return ratios.length > 0 && ratios.some((r) => r !== 'auto');
}

function normalize(kind: Kind, m: RawModel): CatalogModel | null {
  if (!m.model || !m.name) return null;
  const verified = VERIFIED_MODELS[m.model];
  if (!verified) return null;
  if (kind === 'video' ? !isUsableVideo(m) : !isUsableImage(m)) return null;

  const allowedModes = ALLOWED_MODES[m.model];
  const range = TESTED_RANGE[m.model];
  const rawModes = (m.modes?.length ? m.modes : m.mode)?.filter(
    (o) => (!allowedModes || allowedModes.includes(String(o.type))) && inRange(range, 'mode', String(o.type)),
  );
  const modes = modeOptions(rawModes);
  const resolutions = options(m.resolutions, 'resolution').filter((o) => inRange(range, 'resolution', o.value));
  const durations = options(m.durations, 'duration').filter((o) => inRange(range, 'duration', o.value));
  const modeCredits: Record<string, number> = {};
  for (const o of rawModes ?? []) {
    if (o.type && typeof o.price === 'number' && o.price > 0) modeCredits[String(o.type)] = gaiaCredits(o.price);
  }
  // Chỉ giữ dòng giá người dùng chọn được: Gommo có liệt kê giá cho mode/độ phân giải không có trong danh sách
  // lựa chọn (vd. minimax_h3_max "trial" 500 trong khi mode chọn được rẻ nhất là 5.915), làm "từ X credit" sai.
  const sellable = (list: Option[], value: unknown) =>
    value === undefined || value === null || value === '' || !list.length || list.some((o) => o.value === String(value));
  const prices: PriceRow[] = (m.prices ?? [])
    .filter((p) => typeof p.price === 'number' && p.price > 0)
    .filter((p) => sellable(modes, p.mode) && sellable(resolutions, p.resolution) && sellable(durations, p.duration))
    .map((p) => ({
      ...(p.mode ? { mode: String(p.mode) } : {}),
      ...(p.resolution ? { resolution: String(p.resolution) } : {}),
      ...(p.duration !== undefined && p.duration !== null && p.duration !== '' ? { duration: String(p.duration) } : {}),
      credits: gaiaCredits(p.price as number),
    }))
    .filter((p) => !range?.exclude?.(p));
  const baseCredits = gaiaCredits(Number(m.price) || 0);
  const candidates = prices.length ? prices.map((p) => p.credits) : [...Object.values(modeCredits), baseCredits];
  const fromCredits = Math.min(...candidates.filter((c) => c > 0));
  if (!Number.isFinite(fromCredits) || fromCredits <= 0) return null; // không có giá thì không bán

  const start = kind === 'video' && Boolean(m.startImage) && Boolean(verified.start);
  const end = start && Boolean(m.startImageAndEnd) && Boolean(verified.end);
  const startRequired = kind === 'video' && START_FRAME_REQUIRED.includes(m.model);
  if (startRequired && !start) return null; // bắt buộc Start frame mà Start frame chưa chạy được thì không tạo được gì
  const maxReferences = kind === 'image' && m.withSubject && verified.refs ? Math.max(0, Number(m.maxSubject) || 0) : 0;
  const tags: string[] = [];
  if (kind === 'video') {
    if (!startRequired) tags.push('Text → Video');
    if (start) tags.push('Image → Video');
    if (end) tags.push('Start + End frame');
  } else {
    tags.push('Text → Image');
    if (maxReferences > 0) tags.push('Reference');
  }

  let available = m.status === undefined || m.status === null || m.status === 'ON';
  let unavailableReason: string | undefined = available ? undefined : 'Đang bảo trì';
  let daily: CatalogModel['daily'];
  const used = Number(m.videoTotalToday);
  const max = Number(m.videoMaxToday);
  if (Number.isFinite(max) && max > 0) {
    daily = { used: Number.isFinite(used) ? used : 0, max };
    if (daily.used >= max) {
      available = false;
      unavailableReason = 'Hết lượt hôm nay';
    }
  }

  return {
    id: m.model,
    name: m.name.trim().replace(/\s+/g, ' '),
    kind,
    available,
    unavailableReason,
    ratios: options(m.ratios, 'ratio'),
    resolutions,
    durations,
    modes,
    prices,
    baseCredits,
    modeCredits,
    fromCredits,
    tags,
    frames: {
      start,
      end,
      startRequired,
      ...(end && END_FRAME_MODES[m.model]
        ? { endModes: END_FRAME_MODES[m.model].filter((v) => modes.some((o) => o.value === v)) }
        : {}),
    },
    maxReferences,
    edit: kind === 'image' && Boolean(verified.edit),
    daily,
  };
}

const TTL_MS = 5 * 60_000;
let cache: { at: number; image: CatalogModel[]; video: CatalogModel[] } | null = null;
let inflight: Promise<{ image: CatalogModel[]; video: CatalogModel[] }> | null = null;

async function fetchKind(kind: Kind): Promise<CatalogModel[]> {
  const data = await gommoPost<{ data?: RawModel[] }>('/ai/models', { type: kind });
  const models = (data.data ?? []).map((m) => normalize(kind, m)).filter((m): m is CatalogModel => m !== null);
  return byPreferredOrder(kind, models);
}

/**
 * Danh mục model, lưu tạm 5 phút. Quá 5 phút thì vẫn trả bản cũ ngay và tải bản mới ngầm, vì Gommo trả
 * danh sách model mất ~1,6 giây và trang không nên chờ. Gommo lỗi mà còn bản cũ thì dùng bản cũ.
 */
export async function getCatalog(): Promise<{ image: CatalogModel[]; video: CatalogModel[] }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  const stale = cache;
  if (!inflight) {
    inflight = Promise.all([fetchKind('image'), fetchKind('video')])
      .then(([image, video]) => {
        cache = { at: Date.now(), image, video };
        return cache;
      })
      .catch((err) => {
        if (cache) return cache;
        throw err;
      })
      .finally(() => {
        inflight = null;
      });
  }
  if (stale) {
    inflight.catch(() => {});
    return stale;
  }
  return inflight;
}

export async function getModel(kind: Kind, id: string): Promise<CatalogModel | undefined> {
  const catalog = await getCatalog();
  return catalog[kind].find((m) => m.id === id);
}

export async function getFeaturedModels(): Promise<CatalogModel[]> {
  const catalog = await getCatalog();
  const all = [...catalog.video, ...catalog.image];
  const featured = FEATURED_MODELS.map((id) => all.find((m) => m.id === id)).filter(
    (m): m is CatalogModel => Boolean(m),
  );
  return featured.length ? featured : all.slice(0, 4);
}
