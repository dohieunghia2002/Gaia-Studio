// Tính giá và chuẩn hoá lựa chọn tham số của model. Dùng chung cho server (để tính tiền)
// và client (để hiện giá trước khi bấm Tạo), nên không được chứa bí mật.

import type { CatalogModel, Option, PriceRow, Selection } from './types';

const PRICE_FIELDS = ['mode', 'resolution', 'duration'] as const;
type PriceField = (typeof PRICE_FIELDS)[number];

function rowMatches(row: PriceRow, sel: Selection): boolean {
  return PRICE_FIELDS.every((f) => !row[f] || !sel[f] || row[f] === sel[f]);
}

function specificity(row: PriceRow): number {
  return PRICE_FIELDS.reduce((n, f) => n + (row[f] ? 1 : 0), 0);
}

/**
 * Giá (credit GAIA) cho một lựa chọn. `null` khi model có bảng giá nhưng không bán tổ hợp này.
 * Nhiều dòng khớp thì lấy dòng cụ thể nhất, hoà thì lấy giá cao nhất để không tính thiếu.
 */
export function priceFor(model: CatalogModel, sel: Selection): number | null {
  if (model.prices.length) {
    const matches = model.prices.filter((r) => rowMatches(r, sel));
    if (!matches.length) return null;
    const best = Math.max(...matches.map(specificity));
    return Math.max(...matches.filter((r) => specificity(r) === best).map((r) => r.credits));
  }
  if (sel.mode && model.modeCredits[sel.mode] != null) return model.modeCredits[sel.mode];
  return model.baseCredits;
}

function pick(options: Option[], value: string | undefined): string | undefined {
  if (!options.length) return undefined;
  if (options.some((o) => o.value === value)) return value;
  // Mặc định tránh "auto" nếu model có tỉ lệ cụ thể.
  return (options.find((o) => o.value.toLowerCase() !== 'auto') ?? options[0]).value;
}

function optionsOf(model: CatalogModel, field: keyof Selection): Option[] {
  switch (field) {
    case 'ratio':
      return model.ratios;
    case 'resolution':
      return model.resolutions;
    case 'duration':
      return model.durations;
    case 'mode':
      return model.modes;
  }
}

/**
 * Đưa lựa chọn về giá trị hợp lệ của model. Nếu tổ hợp không có trong bảng giá, chọn dòng giá
 * gần nhất (giữ trường vừa đổi `changed`, giữ được càng nhiều trường hiện tại càng tốt).
 */
export function resolveSelection(model: CatalogModel, sel: Selection, changed?: keyof Selection): Selection {
  const next: Selection = {
    ratio: pick(model.ratios, sel.ratio),
    resolution: pick(model.resolutions, sel.resolution),
    duration: pick(model.durations, sel.duration),
    mode: pick(model.modes, sel.mode),
  };
  if (!model.prices.length || priceFor(model, next) != null) return next;

  let rows = model.prices.filter((r) =>
    PRICE_FIELDS.every((f) => !r[f] || optionsOf(model, f).some((o) => o.value === r[f])),
  );
  if (changed && changed !== 'ratio') {
    const field = changed as PriceField;
    const keep = rows.filter((r) => !r[field] || r[field] === next[field]);
    if (keep.length) rows = keep;
  }
  const score = (r: PriceRow) => PRICE_FIELDS.reduce((n, f) => n + (r[f] && r[f] === next[f] ? 1 : 0), 0);
  rows = [...rows].sort((a, b) => score(b) - score(a) || a.credits - b.credits);
  const row = rows[0];
  if (!row) return next;
  for (const f of PRICE_FIELDS) if (row[f]) next[f] = row[f];
  return next;
}

export function defaultSelection(model: CatalogModel): Selection {
  return resolveSelection(model, {});
}

export function selectionFields(model: CatalogModel): (keyof Selection)[] {
  const fields: (keyof Selection)[] = [];
  if (model.ratios.length) fields.push('ratio');
  if (model.resolutions.length) fields.push('resolution');
  if (model.durations.length) fields.push('duration');
  if (model.modes.length) fields.push('mode');
  return fields;
}

export const FIELD_LABEL: Record<keyof Selection, string> = {
  ratio: 'Ratio',
  resolution: 'Resolution',
  duration: 'Duration',
  mode: 'Mode',
};

export function optionLabel(model: CatalogModel | undefined, field: keyof Selection, value?: string): string {
  if (!value) return '';
  const found = model ? optionsOf(model, field).find((o) => o.value === value) : undefined;
  if (found) return found.label;
  return formatOptionValue(field, value);
}

export function formatOptionValue(field: keyof Selection, value: string): string {
  if (field === 'ratio') return ratioLabel(value);
  if (field === 'resolution') return /^\d+k$/i.test(value) ? value.toUpperCase() : value;
  if (field === 'duration') return `${value}s`;
  return value;
}

export function ratioLabel(value: string | undefined): string {
  if (!value) return '';
  if (value.toLowerCase() === 'auto') return 'Auto';
  return value.replace('_', ':');
}

/** Tỉ lệ khung hình dạng số (rộng / cao); `auto` hoặc lạ thì trả 1. */
export function ratioNumber(value: string | undefined): number {
  const m = /^(\d+(?:\.\d+)?)[:_](\d+(?:\.\d+)?)$/.exec(value ?? '');
  if (!m) return 1;
  const r = Number(m[1]) / Number(m[2]);
  return Number.isFinite(r) && r > 0 ? r : 1;
}

/** "Model · 16:9 · 720p" như dòng meta trên thẻ thư viện. */
export function paramSummary(kind: 'image' | 'video', modelName: string, params: Selection): string {
  const parts = [modelName];
  if (params.ratio) parts.push(ratioLabel(params.ratio));
  if (kind === 'video') {
    if (params.duration) parts.push(`${params.duration}s`);
    else if (params.resolution) parts.push(formatOptionValue('resolution', params.resolution));
  } else if (params.resolution) {
    parts.push(formatOptionValue('resolution', params.resolution));
  }
  return parts.join(' · ');
}
