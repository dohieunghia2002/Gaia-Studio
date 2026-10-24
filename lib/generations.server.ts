import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { ApiError, isUuid } from './api.server';
import {
  getProviderBalance,
  GommoError,
  gommoPost,
  noteProviderSpend,
  toGommoImageRefs,
  VIDEO_STATUS,
  type GommoImageInfo,
  type GommoVideoInfo,
} from './gommo';
import { gaiaCredits, getModel, gommoCreditsFor } from './models.server';
import { envNumber } from './env';
import { preparePrompt } from './prompt.server';
import { modeLabels, priceFor, resolveSelection, selectionFields } from './catalog';
import { getBalance } from './credits.server';
import { TRASH_DAYS } from './trash';
import { isPrivateGroup } from './access';
import { dayKey } from './format';
import { isDay, LIBRARY_DAYS_PER_LOAD, LIBRARY_PAGE_SIZE, pageCount } from './library';
import type {
  CatalogModel,
  GenerationInputs,
  GenerationItem,
  GenOp,
  GenStatus,
  Kind,
  LibraryDay,
  LibraryItem,
  MediaRef,
  Selection,
} from './types';

/** 402 khi không đủ credit. Nhóm riêng không có nạp tiền, nên chỉ cách xin thêm. */
function insufficientCredits() {
  return new ApiError(
    402,
    'insufficient_credits',
    isPrivateGroup()
      ? 'Không đủ credit. Bạn nhắn chủ nhóm để được cấp thêm.'
      : 'Không đủ credit. Bạn nạp thêm credit để tiếp tục.',
  );
}

const MAX_PROMPT = 2000;
const MAX_QUANTITY = 4;
const RUNNING: GenStatus[] = ['pending', 'processing'];
// Quá thời gian này mà Gommo chưa xong thì coi là lỗi và hoàn credit.
const TIMEOUT_MS: Record<Kind, number> = { image: 30 * 60_000, video: 4 * 60 * 60_000 };
// Job chưa kịp gửi sang Gommo (server lỗi giữa chừng) sau 3 phút thì coi là lỗi.
const UNSENT_TIMEOUT_MS = 3 * 60_000;

/** Bật khi đã kiểm chứng `credit`/`credit_fee` của Gommo là giá thật: hoàn phần chênh nếu giá thật thấp hơn. */
function settleActualCost(): boolean {
  return process.env.GAIA_SETTLE_ACTUAL_COST === '1';
}

const COLS =
  'id, user_id, kind, op, root_id, source_id, model, model_name, params, inputs, prompt, prompt_sent, translator, gommo_id, status, url, thumb_url, error_message, gommo_cost, credits, refunded_credits, created_at, updated_at, finished_at, deleted_at';

export interface GenRow {
  id: string;
  user_id: string;
  kind: Kind;
  op: GenOp;
  root_id: string | null;
  source_id: string | null;
  model: string;
  model_name: string;
  params: Selection;
  inputs: GenerationInputs;
  prompt: string;
  prompt_sent: string | null;
  translator: string | null;
  gommo_id: string | null;
  status: GenStatus;
  url: string | null;
  thumb_url: string | null;
  error_message: string | null;
  gommo_cost: number | null;
  credits: number;
  refunded_credits: number;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
  deleted_at: string | null;
}

export function toItem(r: GenRow): GenerationItem {
  return {
    id: r.id,
    kind: r.kind,
    op: r.op,
    rootId: r.root_id,
    sourceId: r.source_id,
    model: r.model,
    modelName: r.model_name,
    params: r.params ?? {},
    inputs: r.inputs ?? {},
    prompt: r.prompt,
    status: r.status,
    url: r.url,
    thumbUrl: r.thumb_url,
    // Không đưa thông báo kỹ thuật của Gommo cho người dùng; giao diện dùng câu chung.
    errorMessage: r.status === 'error' ? 'failed' : null,
    credits: r.credits,
    refundedCredits: r.refunded_credits,
    createdAt: r.created_at,
    finishedAt: r.finished_at,
    deletedAt: r.deleted_at,
  };
}

const db = () => supabaseAdmin();

async function getRow(userId: string, id: string, opts: { deleted?: boolean } = {}): Promise<GenRow> {
  const { data, error } = await db().from('generations').select(COLS).eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const row = data as GenRow | null;
  // Mặc định chỉ lấy mục đang trong thư viện; `deleted: true` chỉ lấy mục đang trong Thùng rác.
  if (!row || Boolean(row.deleted_at) !== Boolean(opts.deleted)) {
    throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  }
  return row;
}

// ───────────────────────── Thư viện ─────────────────────────

export async function listLibrary(
  userId: string,
  opts: { kind?: Kind; before?: string; limit?: number; trash?: boolean } = {},
): Promise<{ items: LibraryItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 100);
  // Thư viện xếp theo ngày tạo; Thùng rác xếp theo lúc xoá (mới xoá lên đầu).
  const sortKey = opts.trash ? 'deleted_at' : 'created_at';
  if (opts.trash) await purgeExpired(userId);
  // Lấy kèm các phiên bản của từng mục trong cùng một lần gọi (mỗi lần gọi Supabase ~250 ms từ máy dev).
  let q = db()
    .from('generations')
    .select(`${COLS}, versions:generations!root_id(${COLS})`)
    .eq('user_id', userId)
    .is('root_id', null)
    .order(sortKey, { ascending: false })
    .order('created_at', { ascending: true, referencedTable: 'versions' })
    .limit(limit + 1);
  q = opts.trash ? q.not('deleted_at', 'is', null) : q.is('deleted_at', null);
  if (opts.kind) q = q.eq('kind', opts.kind);
  if (opts.before) q = q.lt(sortKey, opts.before);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as RootWithVersions[];
  const page = rows.slice(0, limit);
  const items = withVersionSummary(page);
  const last = page[page.length - 1];
  return { items, nextCursor: rows.length > limit ? (opts.trash ? last.deleted_at : last.created_at) : null };
}

// ── Thư viện theo ngày ──
// Cột `day` (ngày tạo theo giờ VN) và index (user_id, day, created_at) có từ supabase/migrations/0003_library_days.sql.

const LIB_SELECT = `${COLS}, versions:generations!root_id(${COLS})`;

/**
 * `LIBRARY_DAYS_PER_LOAD` ngày gần nhất (trước `before` nếu có), mỗi ngày kèm tổng số mục và trang đầu.
 * Hai hàm SQL chạy song song nên chỉ tốn một lượt hỏi Supabase.
 */
export async function listLibraryDays(
  userId: string,
  opts: { kind?: Kind; before?: string } = {},
): Promise<{ days: LibraryDay[]; nextBefore: string | null }> {
  if (opts.before && !isDay(opts.before)) throw new ApiError(400, 'bad_request', 'Ngày không hợp lệ.');
  const args = { p_user: userId, p_kind: opts.kind ?? null, p_before: opts.before ?? null };
  const [counts, firsts] = await Promise.all([
    // Lấy dư một ngày để biết còn ngày cũ hơn không.
    db().rpc('gaia_library_days', { ...args, p_limit: LIBRARY_DAYS_PER_LOAD + 1 }),
    db()
      .rpc('gaia_library_first_pages', { ...args, p_days: LIBRARY_DAYS_PER_LOAD, p_per_day: LIBRARY_PAGE_SIZE })
      .select(LIB_SELECT)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, referencedTable: 'versions' }),
  ]);
  if (counts.error) throw counts.error;
  if (firsts.error) throw firsts.error;
  const byDay = new Map<string, LibraryItem[]>();
  for (const item of withVersionSummary((firsts.data ?? []) as unknown as RootWithVersions[])) {
    const key = dayKey(item.createdAt);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  const rows = (counts.data ?? []) as { day: string; total: number }[];
  const days = rows.slice(0, LIBRARY_DAYS_PER_LOAD).map((r) => ({ day: r.day, total: r.total, page: 1, items: byDay.get(r.day) ?? [] }));
  return { days, nextBefore: rows.length > LIBRARY_DAYS_PER_LOAD ? days[days.length - 1].day : null };
}

/** Trang `page` của một ngày. Trang vượt quá số trang hiện có (vd. vừa xoá bớt) thì trả trang cuối. */
export async function listLibraryDay(userId: string, opts: { kind?: Kind; day: string; page: number }): Promise<LibraryDay> {
  if (!isDay(opts.day)) throw new ApiError(400, 'bad_request', 'Ngày không hợp lệ.');
  const query = (page: number) => {
    const from = (page - 1) * LIBRARY_PAGE_SIZE;
    let q = db()
      .from('generations')
      .select(LIB_SELECT, { count: 'exact' })
      .eq('user_id', userId)
      .is('root_id', null)
      .is('deleted_at', null)
      .eq('day', opts.day)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, referencedTable: 'versions' })
      .range(from, from + LIBRARY_PAGE_SIZE - 1);
    if (opts.kind) q = q.eq('kind', opts.kind);
    return q;
  };
  let page = Math.min(Math.max(Math.floor(opts.page) || 1, 1), 10_000);
  let res = await query(page);
  // PostgREST báo 416 (PGRST103) khi trang bắt đầu sau mục cuối cùng.
  if (res.error?.code === 'PGRST103' || (!res.error && !res.data?.length && page > 1)) {
    const total = res.count ?? (await countDay(userId, opts.day, opts.kind));
    page = pageCount(total);
    res = await query(page);
  }
  if (res.error) throw res.error;
  return {
    day: opts.day,
    total: res.count ?? 0,
    page,
    items: withVersionSummary((res.data ?? []) as unknown as RootWithVersions[]),
  };
}

async function countDay(userId: string, day: string, kind?: Kind): Promise<number> {
  let q = db()
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('root_id', null)
    .is('deleted_at', null)
    .eq('day', day);
  if (kind) q = q.eq('kind', kind);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Số job đang chạy của người dùng, kể cả job nằm ở trang không hiện. Client dựa vào đây để tiếp tục hỏi trạng thái:
 * chưa có cron ở server, job chỉ được cập nhật khi client gọi /api/generations/sync.
 */
export async function runningCount(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', RUNNING);
  if (error) throw error;
  return count ?? 0;
}

/** Số mục trong Thùng rác (hiện trên tab). */
export async function trashCount(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('root_id', null)
    .not('deleted_at', 'is', null);
  if (error) throw error;
  return count ?? 0;
}

type RootWithVersions = GenRow & { versions?: GenRow[] };

function withVersionSummary(roots: RootWithVersions[]): LibraryItem[] {
  return roots.map(({ versions: embedded, ...root }) => {
    // Mục trong thư viện: các phiên bản chưa xoá. Mục trong Thùng rác: các phiên bản bị xoá cùng lúc với nó.
    const versions =
      root.kind === 'image'
        ? (embedded ?? []).filter((v) => v.op !== 'upscale' && v.deleted_at === root.deleted_at)
        : [];
    const all = [root, ...versions];
    const latestDone = [...all].reverse().find((v) => v.status === 'success' && v.url);
    return {
      ...toItem(root),
      versionCount: all.length,
      totalCredits: all.reduce((sum, v) => sum + (v.credits - v.refunded_credits), 0),
      displayId: latestDone?.id ?? null,
      displayUrl: latestDone?.url ?? null,
      displayThumbUrl: latestDone?.thumb_url ?? latestDone?.url ?? null,
    };
  });
}

/** Một mục và (nếu là ảnh) toàn bộ phiên bản, từ bản gốc đến bản mới nhất. */
export async function getDetail(userId: string, id: string): Promise<{ root: GenerationItem; versions: GenerationItem[] }> {
  if (!isUuid(id)) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  // Thường `id` là bản gốc: lấy bản gốc và các phiên bản của nó trong một lần gọi.
  const { data, error } = await db()
    .from('generations')
    .select(COLS)
    .eq('user_id', userId)
    .or(`id.eq.${id},root_id.eq.${id}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as GenRow[];
  const root = rows.find((r) => r.id === id);
  if (!root || root.deleted_at) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  // `id` là một phiên bản: mở theo bản gốc của nó.
  if (root.root_id) return getDetail(userId, root.root_id);
  const versions = rows.filter((r) => r.id !== id && !r.deleted_at && r.op !== 'upscale');
  return { root: toItem(root), versions: [root, ...versions].map(toItem) };
}

// ───────────────────────── Tạo mới ─────────────────────────

export interface CreateRequest {
  kind: Kind;
  model: string;
  prompt: string;
  params: Selection;
  quantity?: number;
  inputs?: GenerationInputs;
  /** Giá client đang hiện cho MỘT mục. Lệch với giá server thì từ chối, không trừ khác số đã hiện. */
  expectedCredits: number;
}

function cleanPrompt(prompt: unknown): string {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  if (!text) throw new ApiError(400, 'empty_prompt', 'Bạn chưa nhập prompt.');
  if (text.length > MAX_PROMPT) throw new ApiError(400, 'prompt_too_long', `Prompt dài tối đa ${MAX_PROMPT} ký tự.`);
  return text;
}

function cleanRef(ref: unknown): MediaRef | undefined {
  if (!ref || typeof ref !== 'object') return undefined;
  const { id, url } = ref as Record<string, unknown>;
  if (typeof id !== 'string' || typeof url !== 'string' || !/^https:\/\//.test(url) || url.length > 2048) {
    throw new ApiError(400, 'bad_input', 'Ảnh tải lên không hợp lệ, bạn thử chọn lại ảnh.');
  }
  return { id, url };
}

function cleanInputs(model: CatalogModel, inputs: GenerationInputs = {}): GenerationInputs {
  const out: GenerationInputs = {};
  if (model.kind === 'video') {
    const start = cleanRef(inputs.start);
    const end = cleanRef(inputs.end);
    if (start && !model.frames.start) throw new ApiError(400, 'bad_input', `${model.name} không hỗ trợ Start frame.`);
    if (!start && model.frames.startRequired) {
      throw new ApiError(400, 'bad_input', `${model.name} cần Start frame. Bạn thêm ảnh rồi tạo lại nhé.`);
    }
    if (end && (!model.frames.end || !start)) throw new ApiError(400, 'bad_input', 'End frame cần có Start frame trước.');
    if (start) out.start = start;
    if (end) out.end = end;
  } else if (Array.isArray(inputs.references) && inputs.references.length) {
    if (inputs.references.length > model.maxReferences) {
      throw new ApiError(400, 'bad_input', `${model.name} nhận tối đa ${model.maxReferences} ảnh reference.`);
    }
    out.references = inputs.references.map((r) => cleanRef(r)!).filter(Boolean);
  }
  return out;
}

async function loadModel(kind: Kind, modelId: string): Promise<CatalogModel> {
  const model = await getModel(kind, modelId);
  if (!model) throw new ApiError(409, 'model_unavailable', 'Model này hiện không còn trong danh sách. Bạn chọn model khác nhé.');
  if (!model.available) {
    throw new ApiError(409, 'model_unavailable', `${model.name}: ${model.unavailableReason ?? 'tạm thời không dùng được'}.`);
  }
  return model;
}

/** Kiểm tra lựa chọn của client đúng là một tổ hợp model bán, trả lựa chọn chuẩn và giá. */
function checkSelection(model: CatalogModel, params: Selection, expectedCredits: number) {
  const resolved = resolveSelection(model, params ?? {});
  for (const field of selectionFields(model)) {
    if (params?.[field] !== resolved[field]) {
      throw new ApiError(409, 'params_changed', 'Thông số của model vừa thay đổi. Bạn kiểm tra lại lựa chọn rồi bấm Tạo.');
    }
  }
  const credits = priceFor(model, resolved);
  if (credits == null) throw new ApiError(409, 'params_changed', 'Model không hỗ trợ tổ hợp thông số này.');
  if (credits !== expectedCredits) {
    throw new ApiError(409, 'price_changed', `Giá vừa cập nhật thành ${credits} credit. Bạn kiểm tra lại rồi bấm Tạo.`);
  }
  return { params: resolved, credits };
}

function usageDetail(model: CatalogModel | { name: string }, kind: Kind, params: Selection): string {
  const extra = kind === 'video' ? (params.duration ? `${params.duration}s` : params.mode) : params.resolution?.toUpperCase();
  return extra ? `${model.name} · ${extra}` : model.name;
}

async function insertGeneration(args: {
  userId: string;
  kind: Kind;
  op: GenOp;
  rootId?: string | null;
  sourceId?: string | null;
  model: string;
  modelName: string;
  params: Selection;
  inputs: GenerationInputs;
  prompt: string;
  credits: number;
  title: string;
  detail: string;
}): Promise<GenRow> {
  const { data, error } = await db().rpc('gaia_create_generation', {
    p_user: args.userId,
    p_kind: args.kind,
    p_op: args.op,
    p_root: args.rootId ?? null,
    p_source: args.sourceId ?? null,
    p_model: args.model,
    p_model_name: args.modelName,
    p_params: args.params,
    p_inputs: args.inputs,
    p_prompt: args.prompt,
    p_credits: args.credits,
    p_title: args.title,
    p_detail: args.detail,
  });
  if (error) {
    if (error.message?.includes('INSUFFICIENT_CREDITS')) {
      throw insufficientCredits();
    }
    throw error;
  }
  return data as GenRow;
}

/**
 * Chốt an toàn (founder chọn 19/10/2026): tài khoản Gommo (79ai) của GAIA không đủ tiền cho lượt này thì dừng ngay,
 * trước khi trừ credit của người dùng, thay vì để Gommo từ chối rồi mới hoàn. `GAIA_PROVIDER_RESERVE` (credit Gommo,
 * mặc định 0) giữ lại một khoản dự phòng. Không hỏi được số dư thì không chặn.
 */
async function ensureProviderBalance(gaia: number) {
  const balance = await getProviderBalance();
  if (balance == null) return;
  const needed = gommoCreditsFor(gaia);
  if (balance - needed < envNumber('GAIA_PROVIDER_RESERVE', 0)) {
    console.error('[provider] số dư Gommo không đủ', { balance, needed });
    throw new ApiError(503, 'provider_paused', 'GAIA đang tạm dừng nhận yêu cầu tạo mới. Credit của bạn chưa bị trừ. Bạn thử lại sau nhé.');
  }
  noteProviderSpend(needed);
}

export async function createGenerations(userId: string, req: CreateRequest): Promise<GenerationItem[]> {
  const kind: Kind = req.kind === 'video' ? 'video' : 'image';
  const prompt = cleanPrompt(req.prompt);
  const model = await loadModel(kind, String(req.model ?? ''));
  const { params, credits } = checkSelection(model, req.params, Number(req.expectedCredits));
  const inputs = cleanInputs(model, req.inputs);
  const endModes = model.frames.endModes;
  if (inputs.end && endModes && !endModes.includes(String(params.mode ?? ''))) {
    throw new ApiError(400, 'bad_input', `${model.name} chỉ tạo được Start + End frame ở Mode ${modeLabels(model, endModes)}.`);
  }
  const quantity = kind === 'image' ? Math.min(Math.max(Math.floor(Number(req.quantity) || 1), 1), MAX_QUANTITY) : 1;

  if ((await getBalance(userId)) < credits * quantity) {
    throw insufficientCredits();
  }
  await ensureProviderBalance(credits * quantity);

  const rows: GenRow[] = [];
  for (let i = 0; i < quantity; i++) {
    try {
      rows.push(
        await insertGeneration({
          userId,
          kind,
          op: 'create',
          model: model.id,
          modelName: model.name,
          params,
          inputs,
          prompt,
          credits,
          title: kind === 'video' ? 'Tạo video' : 'Tạo ảnh',
          detail: usageDetail(model, kind, params),
        }),
      );
    } catch (err) {
      if (rows.length) break; // đã tạo được vài ảnh thì vẫn chạy các ảnh đó
      throw err;
    }
  }

  const started = await Promise.all(rows.map((row) => submitToGommo(row, { model })));
  return started.map(toItem);
}

/** Tạo lại với đúng thông số cũ ("Thử lại" trên thẻ lỗi, "Tạo lại" ở trang video). */
export async function rerunGeneration(userId: string, id: string, expectedCredits: number): Promise<GenerationItem[]> {
  const row = await getRow(userId, id);
  if (row.op !== 'create') throw new ApiError(400, 'bad_request', 'Chỉ tạo lại được ảnh/video gốc.');
  const created = await createGenerations(userId, {
    kind: row.kind,
    model: row.model,
    prompt: row.prompt,
    params: row.params,
    inputs: row.inputs,
    expectedCredits,
  });
  if (row.status === 'error') {
    // Thẻ lỗi đã được thay bằng lần thử mới; ẩn thẻ cũ khỏi thư viện.
    await db().from('generations').update({ deleted_at: new Date().toISOString() }).eq('id', row.id).eq('user_id', userId);
  }
  return created;
}

async function submitToGommo(row: GenRow, ctx: { model?: CatalogModel; base64Image?: string }): Promise<GenRow> {
  try {
    const prepared = await preparePrompt(row.kind, row.prompt);
    const p = row.params ?? {};
    let gommoId: string | undefined;
    let gommoCost: number | undefined;
    let promptSent: string | undefined;
    let status: GenStatus = 'pending';

    if (row.kind === 'image') {
      const refs = row.inputs?.references ?? [];
      const data = await gommoPost<{ imageInfo?: GommoImageInfo }>('/ai/generateImage', {
        action_type: 'create',
        model: row.model,
        prompt: prepared.prompt,
        ratio: p.ratio,
        resolution: p.resolution,
        mode: p.mode,
        project_id: 'default',
        subjects: refs.length ? toGommoImageRefs(refs) : undefined,
        editImage: ctx.base64Image ? 'true' : undefined,
        base64Image: ctx.base64Image,
      });
      gommoId = data.imageInfo?.id_base;
      if (data.imageInfo?.status === 'PENDING_PROCESSING') status = 'processing';
    } else {
      const frames = [row.inputs?.start, row.inputs?.end].filter((f): f is MediaRef => Boolean(f));
      const data = await gommoPost<{ videoInfo?: GommoVideoInfo }>('/ai/create-video', {
        model: row.model,
        prompt: prepared.prompt,
        privacy: 'PRIVATE',
        translate_to_en: prepared.translateToEn ? 'true' : undefined,
        ratio: p.ratio,
        resolution: p.resolution,
        duration: p.duration,
        mode: p.mode,
        images: frames.length ? toGommoImageRefs(frames) : undefined,
        project_id: 'default',
      });
      gommoId = data.videoInfo?.id_base;
      gommoCost = typeof data.videoInfo?.credit_fee === 'number' ? data.videoInfo.credit_fee : undefined;
      // Nếu Gommo trả về prompt đã dịch thì lưu lại để đối chiếu.
      if (data.videoInfo?.prompt && data.videoInfo.prompt.trim() !== prepared.prompt) promptSent = data.videoInfo.prompt;
      const s = data.videoInfo?.status;
      if (s === VIDEO_STATUS.active || s === VIDEO_STATUS.processing) status = 'processing';
    }

    if (!gommoId) throw new GommoError('Gommo không trả về mã job');

    const { data: updated, error } = await db()
      .from('generations')
      .update({
        gommo_id: gommoId,
        status,
        gommo_cost: gommoCost ?? null,
        prompt_sent: promptSent ?? (prepared.prompt !== row.prompt ? prepared.prompt : null),
        translator: prepared.translator,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select(COLS)
      .single();
    if (error) throw error;
    return updated as GenRow;
  } catch (err) {
    console.error('[generate] gửi Gommo lỗi', row.id, err instanceof Error ? err.message : err);
    return failGeneration(row, err instanceof Error ? err.message : 'Gửi Gommo lỗi');
  }
}

// ───────────────────────── Kết thúc job ─────────────────────────

async function reread(id: string, fallback: GenRow): Promise<GenRow> {
  const { data } = await db().from('generations').select(COLS).eq('id', id).maybeSingle();
  return (data as GenRow | null) ?? fallback;
}

async function refund(row: GenRow, amount: number | null, title: string, detail: string) {
  const { error } = await db().rpc('gaia_refund', {
    p_generation: row.id,
    p_amount: amount,
    p_title: title,
    p_detail: detail,
  });
  if (error) console.error('[refund] lỗi hoàn credit', row.id, error.message);
}

function refundDetail(row: GenRow): string {
  if (row.op === 'edit') return `Sửa ảnh lỗi · ${row.model_name}`;
  return `${row.kind === 'video' ? 'Video' : 'Ảnh'} lỗi · ${row.model_name}`;
}

/** Đánh dấu lỗi và hoàn toàn bộ credit. Chỉ request nào chuyển trạng thái thành công mới hoàn. */
async function failGeneration(row: GenRow, message: string): Promise<GenRow> {
  const now = new Date().toISOString();
  const { data } = await db()
    .from('generations')
    .update({ status: 'error', error_message: message.slice(0, 500), finished_at: now, updated_at: now })
    .eq('id', row.id)
    .in('status', RUNNING)
    .select(COLS);
  if (data?.length) await refund(row, null, 'Hoàn credit', refundDetail(row));
  // Request khác đã kết thúc job này trước thì trả trạng thái mới nhất.
  return reread(row.id, row);
}

async function succeedGeneration(row: GenRow, result: { url: string; thumb?: string | null; cost?: number }): Promise<GenRow> {
  const now = new Date().toISOString();
  const { data } = await db()
    .from('generations')
    .update({
      status: 'success',
      url: result.url,
      thumb_url: result.thumb ?? null,
      gommo_cost: typeof result.cost === 'number' ? result.cost : row.gommo_cost,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', row.id)
    .in('status', RUNNING)
    .select(COLS);
  if (!data?.length) return reread(row.id, row);
  if (settleActualCost() && typeof result.cost === 'number' && result.cost > 0) {
    const actual = gaiaCredits(result.cost);
    if (actual < row.credits) {
      await refund(row, row.credits - actual, 'Hoàn chênh lệch', `Giá thực tế thấp hơn · ${row.model_name}`);
      return reread(row.id, data[0] as GenRow);
    }
  }
  return data[0] as GenRow;
}

async function markProcessing(row: GenRow): Promise<GenRow> {
  if (row.status === 'processing') return row;
  const { data } = await db()
    .from('generations')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('status', 'pending')
    .select(COLS);
  return (data?.[0] as GenRow | undefined) ?? row;
}

// ───────────────────────── Đồng bộ trạng thái ─────────────────────────

async function syncOne(row: GenRow): Promise<GenRow> {
  const age = Date.now() - new Date(row.created_at).getTime();
  if (!row.gommo_id) {
    return age > UNSENT_TIMEOUT_MS ? failGeneration(row, 'Không gửi được yêu cầu sang Gommo') : row;
  }
  try {
    let next = row;
    if (row.kind === 'image') {
      const data = await gommoPost<{ imageInfo?: GommoImageInfo }>('/ai/image', { id_base: row.gommo_id });
      const info = data.imageInfo;
      if (info?.status === 'SUCCESS' && info.url) {
        return succeedGeneration(row, { url: info.url, thumb: info.url_thumb || info.url_preview, cost: info.credit });
      }
      if (info?.status === 'ERROR') return confirmFailure(row, info.message || 'Gommo báo lỗi');
      next = await clearSuspectedFailure(row);
      if (info?.status === 'PENDING_PROCESSING') next = await markProcessing(next);
    } else {
      const data = await gommoPost<{ videoInfo?: GommoVideoInfo }>('/ai/video', { videoId: row.gommo_id });
      const info = data.videoInfo;
      const s = info?.status;
      if (s === VIDEO_STATUS.failed || s === VIDEO_STATUS.error) {
        return confirmFailure(row, info?.message || 'Gommo báo lỗi');
      }
      next = await clearSuspectedFailure(row);
      if (s === VIDEO_STATUS.success) {
        // download_url có thể xuất hiện chậm vài giây sau khi đã SUCCESSFUL.
        if (info?.download_url) {
          return succeedGeneration(next, { url: info.download_url, thumb: info.thumbnail_url, cost: info.credit_fee });
        }
        next = await markProcessing(next);
      } else if (s === VIDEO_STATUS.active || s === VIDEO_STATUS.processing) {
        next = await markProcessing(next);
      } else if (s !== VIDEO_STATUS.pending) {
        // Trạng thái lạ KHÔNG phải là lỗi: 16/10/2026 Seedance 2.0 Pro báo "Đang chuyển máy chủ xử lý..." rồi vẫn
        // thành công (Gommo đã trừ tiền), trong khi GAIA cũ coi là lỗi và hoàn tiền. Cứ chờ tiếp; hết giờ thì timeout lo.
        console.warn('[sync] trạng thái video lạ, chờ tiếp', row.id, s, info?.message);
      }
    }
    if (age > TIMEOUT_MS[row.kind]) return failGeneration(row, 'Quá thời gian chờ');
    return next;
  } catch (err) {
    if (err instanceof GommoError && err.code === 'not_found') return failGeneration(row, 'Gommo không tìm thấy job');
    console.error('[sync]', row.id, err instanceof Error ? err.message : err);
    if (age > TIMEOUT_MS[row.kind]) return failGeneration(row, 'Quá thời gian chờ');
    return row;
  }
}

/**
 * Gommo có lúc báo lỗi thoáng qua rồi vẫn chạy tiếp, nên chỉ chốt lỗi (và hoàn credit) khi Gommo báo lỗi
 * liên tục ít nhất FAIL_CONFIRM_MS. Lần đầu thấy lỗi: ghi tạm vào error_message (chưa hiện cho người dùng,
 * vì chỉ mục status = error mới hiện lỗi) và bấm giờ bằng updated_at.
 */
const FAIL_CONFIRM_MS = 60_000;

async function confirmFailure(row: GenRow, message: string): Promise<GenRow> {
  if (row.error_message) {
    const seenFor = Date.now() - new Date(row.updated_at).getTime();
    return seenFor >= FAIL_CONFIRM_MS ? failGeneration(row, message) : row;
  }
  const { data } = await db()
    .from('generations')
    .update({ error_message: message.slice(0, 500), updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .in('status', RUNNING)
    .select(COLS);
  return (data?.[0] as GenRow | undefined) ?? row;
}

/** Gommo hết báo lỗi (job chạy tiếp): xoá dấu lỗi tạm để lần lỗi sau bấm giờ lại từ đầu. */
async function clearSuspectedFailure(row: GenRow): Promise<GenRow> {
  if (!row.error_message) return row;
  const { data } = await db()
    .from('generations')
    .update({ error_message: null, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .in('status', RUNNING)
    .select(COLS);
  return (data?.[0] as GenRow | undefined) ?? row;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Hỏi Gommo trạng thái mọi job đang chạy của người dùng, cập nhật DB, hoàn credit job lỗi. */
export async function syncRunning(userId: string): Promise<GenerationItem[]> {
  const { data, error } = await db()
    .from('generations')
    .select(COLS)
    .eq('user_id', userId)
    .in('status', RUNNING)
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) throw error;
  const rows = (data ?? []) as GenRow[];
  const synced = await mapLimit(rows, 6, syncOne);
  return synced.map(toItem);
}

/**
 * Cron mỗi ngày (app/api/cron/daily): cập nhật job đang chạy của mọi người dùng, kể cả khi không ai mở GAIA,
 * để job treo hết hạn chờ thì được báo lỗi và hoàn credit. syncOne chỉ đổi trạng thái khi job còn đang chạy
 * và hoàn credit không hoàn quá số đã trừ, nên chạy trùng hay chạy cùng lúc với client vẫn an toàn.
 * Lần đọc bảng này cũng giữ Supabase gói Free không bị tạm dừng vì 7 ngày ít hoạt động.
 */
export async function syncAllRunning(): Promise<{ checked: number; finished: number }> {
  const { data, error } = await db()
    .from('generations')
    .select(COLS)
    .in('status', RUNNING)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as GenRow[];
  const synced = await mapLimit(rows, 6, syncOne);
  return { checked: rows.length, finished: synced.filter((r) => !RUNNING.includes(r.status)).length };
}

// ───────────────────────── Sửa ảnh ─────────────────────────

async function successfulImage(userId: string, id: string): Promise<GenRow> {
  const row = await getRow(userId, id);
  if (row.kind !== 'image' || row.status !== 'success' || !row.url) {
    throw new ApiError(400, 'bad_request', 'Chỉ sửa được ảnh đã tạo xong.');
  }
  return row;
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new ApiError(502, 'upstream', 'Không tải được ảnh gốc để sửa. Bạn thử lại sau.');
  const type = res.headers.get('content-type')?.split(';')[0] || 'image/png';
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 20 * 1024 * 1024) throw new ApiError(400, 'too_large', 'Ảnh quá lớn để sửa.');
  return `data:${type};base64,${buf.toString('base64')}`;
}

export async function editImage(
  userId: string,
  sourceId: string,
  req: { prompt: string; model?: string; expectedCredits: number; quantity?: number },
): Promise<GenerationItem[]> {
  const source = await successfulImage(userId, sourceId);
  const prompt = cleanPrompt(req.prompt);
  const model = await loadModel('image', req.model || source.model);
  if (!model.edit) throw new ApiError(400, 'bad_input', `${model.name} chưa sửa ảnh được. Bạn chọn model khác nhé.`);
  const params = resolveSelection(model, source.params ?? {});
  const credits = priceFor(model, params);
  if (credits == null) throw new ApiError(409, 'params_changed', 'Model này không sửa được ảnh với thông số hiện tại.');
  if (credits !== Number(req.expectedCredits)) {
    throw new ApiError(409, 'price_changed', `Giá vừa cập nhật thành ${credits} credit. Bạn kiểm tra lại rồi bấm Tạo bản sửa.`);
  }
  const quantity = Math.min(Math.max(Math.floor(Number(req.quantity) || 1), 1), MAX_QUANTITY);
  if ((await getBalance(userId)) < credits * quantity) {
    throw insufficientCredits();
  }
  await ensureProviderBalance(credits * quantity);
  const base64Image = await fetchAsDataUrl(source.url!);
  const rows: GenRow[] = [];
  for (let i = 0; i < quantity; i++) {
    try {
      rows.push(
        await insertGeneration({
          userId,
          kind: 'image',
          op: 'edit',
          rootId: source.root_id ?? source.id,
          sourceId: source.id,
          model: model.id,
          modelName: model.name,
          params,
          inputs: {},
          prompt,
          credits,
          title: 'Sửa ảnh',
          detail: model.name,
        }),
      );
    } catch (err) {
      if (rows.length) break; // đã tạo được vài bản thì vẫn chạy các bản đó
      throw err;
    }
  }
  const started = await Promise.all(rows.map((row) => submitToGommo(row, { model, base64Image })));
  return started.map(toItem);
}

// ───────────────────────── Thùng rác, hoàn tác, tải về ─────────────────────────
//
// Xoá mềm: mục (gốc + mọi phiên bản) được đánh dấu `deleted_at` và nằm trong Thùng rác.
// Xoá cứng: xoá hẳn dòng trong DB (các phiên bản đi theo nhờ `on delete cascade`; lịch sử credit
// giữ nguyên vì `credit_ledger.generation_id` là `on delete set null`). File trên Gommo không xoá được
// (Gommo không có API xoá), GAIA chỉ quên đường dẫn. Mục đang tạo dở không bao giờ bị xoá cứng.

/** Chuyển cả ảnh/video vào Thùng rác, hoặc xoá một phiên bản sửa (`scope: 'version'`). */
export async function softDelete(userId: string, id: string, scope: 'item' | 'version') {
  const row = await getRow(userId, id);
  const stamp = new Date().toISOString();
  if (scope === 'version') {
    if (!row.root_id) throw new ApiError(400, 'bad_request', 'Không xoá riêng được bản gốc. Hãy xoá cả ảnh.');
    await db().from('generations').update({ deleted_at: stamp }).eq('id', row.id).eq('user_id', userId);
    return { rootId: row.root_id, deletedAt: stamp };
  }
  const rootId = row.root_id ?? row.id;
  const { error } = await db()
    .from('generations')
    .update({ deleted_at: stamp })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`id.eq.${rootId},root_id.eq.${rootId}`);
  if (error) throw error;
  return { rootId, deletedAt: stamp };
}

/**
 * Hoàn tác xoá, hoặc khôi phục từ Thùng rác: đưa lại mọi dòng bị xoá cùng lúc (cùng `deleted_at`).
 * Không truyền `deletedAt` thì lấy dấu thời gian xoá của chính mục đó trong Thùng rác.
 */
export async function restoreDeleted(userId: string, id: string, deletedAt?: string) {
  const stamp = deletedAt ?? (await getRow(userId, id, { deleted: true })).deleted_at!;
  const { error } = await db()
    .from('generations')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('deleted_at', stamp)
    .or(`id.eq.${id},root_id.eq.${id}`);
  if (error) throw error;
}

/** Xoá vĩnh viễn một mục đang trong Thùng rác. */
export async function purgeItem(userId: string, id: string) {
  const row = await getRow(userId, id, { deleted: true });
  if (row.root_id) throw new ApiError(400, 'bad_request', 'Chỉ xoá vĩnh viễn được cả ảnh hoặc video.');
  if (RUNNING.includes(row.status)) {
    throw new ApiError(409, 'running', 'Mục này đang tạo dở. Đợi tạo xong rồi hãy xoá vĩnh viễn.');
  }
  const { error } = await db().from('generations').delete().eq('id', row.id).eq('user_id', userId);
  if (error) throw error;
}

/** Dọn Thùng rác: xoá vĩnh viễn mọi mục trong đó, trừ mục đang tạo dở. Trả về số mục đã xoá. */
export async function emptyTrash(userId: string): Promise<number> {
  const { data, error } = await db()
    .from('generations')
    .delete()
    .eq('user_id', userId)
    .is('root_id', null)
    .not('deleted_at', 'is', null)
    .not('status', 'in', `(${RUNNING.join(',')})`)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

// ── Nhiều mục cùng lúc (chọn nhiều trong thư viện / Thùng rác) ──
// Chia nhỏ danh sách id để URL gửi tới Supabase không quá dài.

export const MAX_BULK = 500;
const BULK_CHUNK = 100;

function chunks<T>(list: T[], size = BULK_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Chuyển nhiều ảnh/video (kèm mọi phiên bản) vào Thùng rác với cùng một mốc `deletedAt`, để Hoàn tác được một lần. */
export async function softDeleteMany(userId: string, ids: string[]) {
  const stamp = new Date().toISOString();
  const rootIds = new Set<string>();
  for (const part of chunks(ids)) {
    const { data, error } = await db().from('generations').select('id, root_id').eq('user_id', userId).is('deleted_at', null).in('id', part);
    if (error) throw error;
    const roots = [...new Set((data ?? []).map((r) => r.root_id ?? r.id))];
    if (!roots.length) continue;
    const list = roots.join(',');
    const { error: e2 } = await db()
      .from('generations')
      .update({ deleted_at: stamp })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(`id.in.(${list}),root_id.in.(${list})`);
    if (e2) throw e2;
    roots.forEach((r) => rootIds.add(r));
  }
  return { rootIds: [...rootIds], deletedAt: stamp };
}

/**
 * Có `deletedAt`: hoàn tác một lần chuyển nhiều mục vào Thùng rác. Không có: khôi phục các mục đang trong Thùng rác,
 * mỗi mục theo mốc xoá của chính nó (phiên bản đã xoá riêng từ trước thì vẫn nằm lại).
 */
export async function restoreMany(userId: string, ids: string[], deletedAt?: string): Promise<number> {
  let restored = 0;
  for (const part of chunks(ids)) {
    const { data, error } = await db()
      .from('generations')
      .select('id, deleted_at')
      .eq('user_id', userId)
      .is('root_id', null)
      .in('id', part)
      .not('deleted_at', 'is', null);
    if (error) throw error;
    const byStamp = new Map<string, string[]>();
    // So theo thời điểm, không so chuỗi: Supabase trả "…811+00:00" trong khi mốc gửi lên là "…811Z".
    const undoAt = deletedAt ? new Date(deletedAt).getTime() : null;
    for (const r of data ?? []) {
      if (undoAt != null && new Date(r.deleted_at).getTime() !== undoAt) continue;
      byStamp.set(r.deleted_at, [...(byStamp.get(r.deleted_at) ?? []), r.id]);
    }
    await Promise.all(
      [...byStamp].map(async ([stamp, roots]) => {
        const list = roots.join(',');
        const { error: e2 } = await db()
          .from('generations')
          .update({ deleted_at: null })
          .eq('user_id', userId)
          .eq('deleted_at', stamp)
          .or(`id.in.(${list}),root_id.in.(${list})`);
        if (e2) throw e2;
        restored += roots.length;
      }),
    );
  }
  return restored;
}

/** Xoá vĩnh viễn nhiều mục trong Thùng rác. Mục đang tạo dở được bỏ qua (giống Dọn thùng rác). */
export async function purgeMany(userId: string, ids: string[]): Promise<string[]> {
  const deleted: string[] = [];
  for (const part of chunks(ids)) {
    const { data, error } = await db()
      .from('generations')
      .delete()
      .eq('user_id', userId)
      .is('root_id', null)
      .not('deleted_at', 'is', null)
      .not('status', 'in', `(${RUNNING.join(',')})`)
      .in('id', part)
      .select('id');
    if (error) throw error;
    deleted.push(...(data ?? []).map((r) => r.id));
  }
  return deleted;
}

/** Tự xoá vĩnh viễn những gì đã nằm trong Thùng rác (hoặc phiên bản đã xoá) quá TRASH_DAYS ngày. */
async function purgeExpired(userId: string) {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60_000).toISOString();
  const { error } = await db()
    .from('generations')
    .delete()
    .eq('user_id', userId)
    .lt('deleted_at', cutoff)
    .not('status', 'in', `(${RUNNING.join(',')})`);
  if (error) throw error;
}

export async function getDownloadable(userId: string, id: string) {
  const row = await getRow(userId, id);
  if (row.status !== 'success' || !row.url) throw new ApiError(404, 'not_ready', 'Mục này chưa có file để tải.');
  return row;
}
