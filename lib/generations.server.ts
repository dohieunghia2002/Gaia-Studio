import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { ApiError } from './api.server';
import { GommoError, gommoPost, toGommoImageRefs, VIDEO_STATUS, type GommoImageInfo, type GommoVideoInfo } from './gommo';
import { gaiaCredits, getModel, UPSCALE_GOMMO_HOLD } from './models.server';
import { preparePrompt } from './prompt.server';
import { priceFor, resolveSelection, selectionFields } from './catalog';
import { getBalance } from './credits.server';
import type {
  CatalogModel,
  GenerationInputs,
  GenerationItem,
  GenOp,
  GenStatus,
  Kind,
  LibraryItem,
  MediaRef,
  Selection,
} from './types';

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
  };
}

const db = () => supabaseAdmin();

async function getRow(userId: string, id: string): Promise<GenRow> {
  const { data, error } = await db().from('generations').select(COLS).eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data || (data as GenRow).deleted_at) throw new ApiError(404, 'not_found', 'Không tìm thấy mục này trong thư viện.');
  return data as GenRow;
}

// ───────────────────────── Thư viện ─────────────────────────

export async function listLibrary(
  userId: string,
  opts: { kind?: Kind; before?: string; limit?: number } = {},
): Promise<{ items: LibraryItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 100);
  let q = db()
    .from('generations')
    .select(COLS)
    .eq('user_id', userId)
    .is('root_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);
  if (opts.kind) q = q.eq('kind', opts.kind);
  if (opts.before) q = q.lt('created_at', opts.before);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as GenRow[];
  const page = rows.slice(0, limit);
  const items = await withVersionSummary(page);
  return { items, nextCursor: rows.length > limit ? page[page.length - 1].created_at : null };
}

async function withVersionSummary(roots: GenRow[]): Promise<LibraryItem[]> {
  const imageRootIds = roots.filter((r) => r.kind === 'image').map((r) => r.id);
  const versionsByRoot = new Map<string, GenRow[]>();
  if (imageRootIds.length) {
    const { data, error } = await db()
      .from('generations')
      .select(COLS)
      .in('root_id', imageRootIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    for (const v of (data ?? []) as GenRow[]) {
      const list = versionsByRoot.get(v.root_id!) ?? [];
      list.push(v);
      versionsByRoot.set(v.root_id!, list);
    }
  }
  return roots.map((root) => {
    const versions = versionsByRoot.get(root.id) ?? [];
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
  const row = await getRow(userId, id);
  const root = row.root_id ? await getRow(userId, row.root_id) : row;
  const { data, error } = await db()
    .from('generations')
    .select(COLS)
    .eq('root_id', root.id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { root: toItem(root), versions: [root, ...((data ?? []) as GenRow[])].map(toItem) };
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

function cleanInputs(model: CatalogModel, inputs: GenerationInputs | undefined): GenerationInputs {
  const out: GenerationInputs = {};
  if (!inputs) return out;
  if (model.kind === 'video') {
    const start = cleanRef(inputs.start);
    const end = cleanRef(inputs.end);
    if (start && !model.frames.start) throw new ApiError(400, 'bad_input', `${model.name} không hỗ trợ Start frame.`);
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
      throw new ApiError(402, 'insufficient_credits', 'Không đủ credit. Bạn nạp thêm credit để tiếp tục.');
    }
    throw error;
  }
  return data as GenRow;
}

export async function createGenerations(userId: string, req: CreateRequest): Promise<GenerationItem[]> {
  const kind: Kind = req.kind === 'video' ? 'video' : 'image';
  const prompt = cleanPrompt(req.prompt);
  const model = await loadModel(kind, String(req.model ?? ''));
  const { params, credits } = checkSelection(model, req.params, Number(req.expectedCredits));
  const inputs = cleanInputs(model, req.inputs);
  const quantity = kind === 'image' ? Math.min(Math.max(Math.floor(Number(req.quantity) || 1), 1), MAX_QUANTITY) : 1;

  if ((await getBalance(userId)) < credits * quantity) {
    throw new ApiError(402, 'insufficient_credits', 'Không đủ credit. Bạn nạp thêm credit để tiếp tục.');
  }

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
  if (row.op === 'upscale') return `Upscale lỗi · ${row.model_name}`;
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
      if (info?.status === 'ERROR') return failGeneration(row, info.message || 'Gommo báo lỗi');
      if (info?.status === 'PENDING_PROCESSING') next = await markProcessing(row);
    } else {
      const data = await gommoPost<{ videoInfo?: GommoVideoInfo }>('/ai/video', { videoId: row.gommo_id });
      const info = data.videoInfo;
      const s = info?.status;
      if (s === VIDEO_STATUS.success) {
        // download_url có thể xuất hiện chậm vài giây sau khi đã SUCCESSFUL.
        if (info?.download_url) {
          return succeedGeneration(row, { url: info.download_url, thumb: info.thumbnail_url, cost: info.credit_fee });
        }
        next = await markProcessing(row);
      } else if (s === VIDEO_STATUS.active || s === VIDEO_STATUS.processing) {
        next = await markProcessing(row);
      } else if (s !== VIDEO_STATUS.pending) {
        // Gommo: mọi trạng thái ngoài danh sách đều coi là lỗi.
        return failGeneration(row, info?.message || `Trạng thái lạ: ${s ?? 'không có'}`);
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

// ───────────────────────── Sửa ảnh, upscale ─────────────────────────

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
  req: { prompt: string; model?: string; expectedCredits: number },
): Promise<GenerationItem> {
  const source = await successfulImage(userId, sourceId);
  const prompt = cleanPrompt(req.prompt);
  const model = await loadModel('image', req.model || source.model);
  const params = resolveSelection(model, source.params ?? {});
  const credits = priceFor(model, params);
  if (credits == null) throw new ApiError(409, 'params_changed', 'Model này không sửa được ảnh với thông số hiện tại.');
  if (credits !== Number(req.expectedCredits)) {
    throw new ApiError(409, 'price_changed', `Giá vừa cập nhật thành ${credits} credit. Bạn kiểm tra lại rồi bấm Tạo bản sửa.`);
  }
  const base64Image = await fetchAsDataUrl(source.url!);
  const row = await insertGeneration({
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
  });
  return toItem(await submitToGommo(row, { model, base64Image }));
}

export function upscaleCredits() {
  return gaiaCredits(UPSCALE_GOMMO_HOLD);
}

export async function upscaleImage(userId: string, sourceId: string, expectedCredits: number): Promise<GenerationItem> {
  const source = await successfulImage(userId, sourceId);
  const credits = upscaleCredits();
  if (credits !== Number(expectedCredits)) {
    throw new ApiError(409, 'price_changed', `Giá upscale vừa cập nhật thành ${credits} credit.`);
  }
  const row = await insertGeneration({
    userId,
    kind: 'image',
    op: 'upscale',
    rootId: source.root_id ?? source.id,
    sourceId: source.id,
    model: 'image_resolution',
    modelName: 'Upscale',
    params: source.params ?? {},
    inputs: {},
    prompt: source.prompt,
    credits,
    title: 'Upscale ảnh',
    detail: source.model_name,
  });
  try {
    const data = await gommoPost<{ imageInfo?: GommoImageInfo }>('/api/apps/go-mmo/ai_templates/tools', {
      id_base: 'image_resolution',
      url: source.url,
      project_id: 'default',
    });
    const info = data.imageInfo;
    if (info?.status === 'ERROR') return toItem(await failGeneration(row, info.message || 'Upscale lỗi'));
    if (info?.url) {
      return toItem(await succeedGeneration(row, { url: info.url, thumb: info.url_thumb || info.url_preview, cost: info.credit }));
    }
    if (info?.id_base) {
      // Không có kết quả ngay thì theo dõi như một job ảnh thường.
      const { data: updated } = await db()
        .from('generations')
        .update({ gommo_id: info.id_base, status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', row.id)
        .select(COLS)
        .single();
      return toItem(updated as GenRow);
    }
    return toItem(await failGeneration(row, 'Gommo không trả kết quả upscale'));
  } catch (err) {
    return toItem(await failGeneration(row, err instanceof Error ? err.message : 'Upscale lỗi'));
  }
}

// ───────────────────────── Xoá, hoàn tác, tải về ─────────────────────────

/** Xoá khỏi thư viện (ẩn, không xoá file trên Gommo vì Gommo không có API xoá). */
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

export async function restoreDeleted(userId: string, id: string, deletedAt: string) {
  const { error } = await db()
    .from('generations')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('deleted_at', deletedAt)
    .or(`id.eq.${id},root_id.eq.${id}`);
  if (error) throw error;
}

export async function getDownloadable(userId: string, id: string) {
  const row = await getRow(userId, id);
  if (row.status !== 'success' || !row.url) throw new ApiError(404, 'not_ready', 'Mục này chưa có file để tải.');
  return row;
}
