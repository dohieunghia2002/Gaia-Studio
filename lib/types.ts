// Kiểu dữ liệu dùng chung giữa server và client.

export type Kind = 'image' | 'video';
export type GenStatus = 'pending' | 'processing' | 'success' | 'error';
// 'upscale' chỉ còn ở vài dòng cũ trong DB (tính năng đã gỡ 2026-10-11); server lọc bỏ khi trả về.
export type GenOp = 'create' | 'edit' | 'upscale';

export interface Option {
  value: string;
  label: string;
}

/** Một dòng bảng giá của model, đã đổi sang credit GAIA. Trường bỏ trống = áp dụng cho mọi giá trị. */
export interface PriceRow {
  mode?: string;
  resolution?: string;
  duration?: string;
  credits: number;
}

export interface CatalogModel {
  id: string; // giá trị gửi vào tham số `model` của Gommo
  name: string;
  kind: Kind;
  available: boolean;
  unavailableReason?: string;
  ratios: Option[];
  resolutions: Option[];
  durations: Option[];
  modes: Option[];
  prices: PriceRow[];
  baseCredits: number;
  modeCredits: Record<string, number>;
  fromCredits: number;
  tags: string[];
  frames: { start: boolean; end: boolean };
  maxReferences: number;
  daily?: { used: number; max: number };
}

export interface Selection {
  ratio?: string;
  resolution?: string;
  duration?: string;
  mode?: string;
}

export interface MediaRef {
  id: string;
  url: string;
}

export interface GenerationInputs {
  start?: MediaRef;
  end?: MediaRef;
  references?: MediaRef[];
}

export interface GenerationItem {
  id: string;
  kind: Kind;
  op: GenOp;
  rootId: string | null;
  sourceId: string | null;
  model: string;
  modelName: string;
  params: Selection;
  inputs: GenerationInputs;
  prompt: string;
  status: GenStatus;
  url: string | null;
  thumbUrl: string | null;
  errorMessage: string | null;
  credits: number;
  refundedCredits: number;
  createdAt: string;
  finishedAt: string | null;
  /** Lúc chuyển vào Thùng rác (null nếu đang ở thư viện). */
  deletedAt: string | null;
}

/** Một ô trong thư viện: bản gốc + tóm tắt các phiên bản sửa (chỉ ảnh mới có). */
export interface LibraryItem extends GenerationItem {
  versionCount: number;
  totalCredits: number;
  /** Ảnh hiển thị trên thẻ: phiên bản thành công mới nhất (cũng là bản "Tải về" tải). */
  displayId: string | null;
  displayUrl: string | null;
  displayThumbUrl: string | null;
}

export type LedgerKind = 'topup' | 'use' | 'refund' | 'expire';

export interface LedgerEntry {
  id: number;
  kind: LedgerKind;
  delta: number;
  balanceAfter: number;
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface CreditSummary {
  balance: number;
  /** Lô credit hết hạn sớm nhất còn dư. */
  nextExpiry: { credits: number; expiresAt: string } | null;
}

export interface TopupView {
  orderCode: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  amountVnd: number;
  credits: number;
  bonusCredits: number;
  qrSvg: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  description: string | null;
  checkoutUrl: string | null;
}
