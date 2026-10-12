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

// ── Danh mục ──

/** Model không muốn bán cho người dùng (giá trị `model` của Gommo). */
export const HIDDEN_MODELS: string[] = [];

/**
 * Model video bắt buộc có Start frame dù Gommo báo `startText: true`. Gommo không có cờ nào cho biết điều này,
 * chỉ biết khi gửi thử: kling_video_2_5 (mode relax) bị từ chối ngay, không trừ tiền, với lỗi
 * "Model Kling 2.5 yêu cầu tối thiểu 1 ảnh tham chiếu" (2026-10-11).
 */
export const START_FRAME_REQUIRED: string[] = ['kling_video_2_5'];

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
  if (HIDDEN_MODELS.includes(m.model)) return null;
  if (kind === 'video' ? !isUsableVideo(m) : !isUsableImage(m)) return null;

  const rawModes = m.modes?.length ? m.modes : m.mode;
  const modes = modeOptions(rawModes);
  const modeCredits: Record<string, number> = {};
  for (const o of rawModes ?? []) {
    if (o.type && typeof o.price === 'number' && o.price > 0) modeCredits[String(o.type)] = gaiaCredits(o.price);
  }
  const prices: PriceRow[] = (m.prices ?? [])
    .filter((p) => typeof p.price === 'number' && p.price > 0)
    .map((p) => ({
      ...(p.mode ? { mode: String(p.mode) } : {}),
      ...(p.resolution ? { resolution: String(p.resolution) } : {}),
      ...(p.duration !== undefined && p.duration !== null && p.duration !== '' ? { duration: String(p.duration) } : {}),
      credits: gaiaCredits(p.price as number),
    }));
  const baseCredits = gaiaCredits(Number(m.price) || 0);
  const candidates = prices.length ? prices.map((p) => p.credits) : [...Object.values(modeCredits), baseCredits];
  const fromCredits = Math.min(...candidates.filter((c) => c > 0));
  if (!Number.isFinite(fromCredits) || fromCredits <= 0) return null; // không có giá thì không bán

  const startRequired = kind === 'video' && Boolean(m.startImage) && START_FRAME_REQUIRED.includes(m.model);
  const tags: string[] = [];
  if (kind === 'video') {
    if (!startRequired) tags.push('Text → Video');
    if (m.startImage) tags.push('Image → Video');
    if (m.startImageAndEnd) tags.push('Start + End frame');
  } else {
    tags.push('Text → Image');
    if (m.withSubject) tags.push('Reference');
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
    resolutions: options(m.resolutions, 'resolution'),
    durations: options(m.durations, 'duration'),
    modes,
    prices,
    baseCredits,
    modeCredits,
    fromCredits,
    tags,
    frames: {
      start: kind === 'video' && Boolean(m.startImage),
      end: kind === 'video' && Boolean(m.startImageAndEnd),
      startRequired,
    },
    maxReferences: kind === 'image' && m.withSubject ? Math.max(0, Number(m.maxSubject) || 0) : 0,
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
