'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { useDismiss } from '../useDismiss';
import { useCredit } from '../CreditContext';
import { useToasts } from '../Toasts';
import { CopyPromptButton, isRunning, MoreMenu, StatusBlock, useNow, useSyncRunning } from './shared';
import { OptionChip } from '../studio/Composer';
import { api, ClientError } from '@/lib/client/api';
import { formatOptionValue, priceFor, ratioLabel, ratioNumber, resolveSelection } from '@/lib/catalog';
import { clampText, fmtDayMonthTime, fmtNumber, fmtTime } from '@/lib/format';
import type { CatalogModel, GenerationItem } from '@/lib/types';

const EDIT_QUANTITIES = ['1', '2', '3', '4'];

function versionLabels(versions: GenerationItem[]): Map<string, string> {
  const labels = new Map<string, string>();
  let edits = 0;
  for (const v of versions) labels.set(v.id, v.rootId ? `Chỉnh sửa ${++edits}` : 'Bản gốc');
  return labels;
}

function EditModelChip({
  models,
  current,
  onPick,
}: {
  models: CatalogModel[];
  current?: CatalogModel;
  onPick: (m: CatalogModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);
  return (
    <div className="chip-wrap" ref={ref}>
      <button type="button" className="chip" style={{ fontWeight: 600 }} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {current?.name ?? 'Chọn model'}
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div className="optmenu" style={{ minWidth: 260 }}>
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={m.id === current?.id}
              disabled={!m.available}
              onClick={() => {
                onPick(m);
                close();
              }}
            >
              <span>{m.name}</span>
              <span className="p">{m.available ? `từ ${fmtNumber(m.fromCredits)}` : m.unavailableReason}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImageDetail({
  initialRoot,
  initialVersions,
  imageModels,
}: {
  initialRoot: GenerationItem;
  initialVersions: GenerationItem[];
  imageModels: CatalogModel[];
}) {
  const router = useRouter();
  const { push } = useToasts();
  const { balance, setBalance, canTopup } = useCredit();
  const [versions, setVersions] = useState(initialVersions);
  const [activeId, setActiveId] = useState(
    () => [...initialVersions].reverse().find((v) => v.status === 'success')?.id ?? initialRoot.id,
  );
  const [editPrompt, setEditPrompt] = useState('');
  const [editModelId, setEditModelId] = useState<string | undefined>(undefined);
  const [editQty, setEditQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [natural, setNatural] = useState<number | null>(null);

  const root = versions.find((v) => !v.rootId) ?? initialRoot;
  const active = versions.find((v) => v.id === activeId) ?? root;
  const labels = useMemo(() => versionLabels(versions), [versions]);
  const anyRunning = versions.some((v) => isRunning(v.status));
  const now = useNow(anyRunning);
  const total = versions.reduce((s, v) => s + v.credits - v.refundedCredits, 0);

  useSyncRunning(anyRunning, (items, bal) => {
    setBalance(bal);
    const byId = new Map(items.map((i) => [i.id, i]));
    setVersions((prev) => prev.map((v) => byId.get(v.id) ?? v));
    // Bản sửa không còn trong danh sách đang chạy → tải lại để lấy trạng thái cuối.
    if (versions.some((v) => isRunning(v.status) && !byId.has(v.id))) {
      api<{ versions: GenerationItem[] }>(`/api/generations/${root.id}`)
        .then((d) => setVersions(d.versions))
        .catch(() => {});
    }
  });

  // Chỉ model đã kiểm chứng sửa được ảnh (có model nhận ảnh gốc nhưng vẽ ảnh mới hoàn toàn).
  const editModels = imageModels.filter((m) => m.edit);
  const editModel =
    editModels.find((m) => m.id === (editModelId ?? active.model)) ??
    editModels.find((m) => m.id === root.model) ??
    editModels.find((m) => m.available);
  const editSel = editModel ? resolveSelection(editModel, active.params) : {};
  const editCredits = editModel ? priceFor(editModel, editSel) : null;
  const editTotal = editCredits == null ? null : editCredits * editQty;
  const lackingEdit = editTotal != null && editTotal > balance;
  const canEdit =
    active.status === 'success' && Boolean(editPrompt.trim()) && editCredits != null && Boolean(editModel?.available) && !lackingEdit && !busy;

  const fail = (err: unknown) => {
    if (err instanceof ClientError && err.code === 'insufficient_credits') {
      push({ kind: 'error', title: err.message, action: canTopup ? { label: 'Nạp credit', href: '/credit' } : undefined });
    } else {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
    }
  };

  const submitEdit = async () => {
    if (!canEdit || !editModel) return;
    setBusy(true);
    try {
      const res = await api<{ items: GenerationItem[]; balance: number }>(`/api/generations/${active.id}/edit`, {
        method: 'POST',
        json: { prompt: editPrompt, model: editModel.id, expectedCredits: editCredits, quantity: editQty },
      });
      setBalance(res.balance);
      setVersions((prev) => [...prev, ...res.items]);
      if (res.items[0]) setActiveId(res.items[0].id);
      setEditPrompt('');
      const failed = res.items.filter((i) => i.status === 'error');
      if (failed.length) {
        push({
          kind: 'error',
          title: failed.length === res.items.length ? 'Không gửi được yêu cầu sửa ảnh' : `${failed.length} bản sửa không gửi được`,
          sub: 'Credit đã được hoàn',
        });
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const deleteVersion = async (v: GenerationItem) => {
    try {
      const res = await api<{ deletedAt: string }>(`/api/generations/${v.id}?scope=version`, { method: 'DELETE' });
      setVersions((prev) => prev.filter((x) => x.id !== v.id));
      setActiveId(root.id);
      push({
        title: `Đã xoá ${labels.get(v.id)?.toLowerCase() ?? 'phiên bản'}`,
        action: {
          label: 'Hoàn tác',
          onClick: () =>
            api(`/api/generations/${v.id}/restore`, { method: 'POST', json: { deletedAt: res.deletedAt } })
              .then(() => setVersions((prev) => [...prev, v].sort((a, b) => a.createdAt.localeCompare(b.createdAt))))
              .catch(fail),
        },
      });
    } catch (err) {
      fail(err);
    }
  };

  const deleteAll = async () => {
    try {
      await api(`/api/generations/${root.id}`, { method: 'DELETE' });
      router.push('/studio');
    } catch (err) {
      fail(err);
    }
  };

  const ratio = active.params.ratio && active.params.ratio !== 'auto' ? ratioNumber(active.params.ratio) : natural ?? 1;
  const activeLabel = labels.get(active.id) ?? '';
  const sortedNewestFirst = [...versions].reverse();

  return (
    <div className="page">
      <header className="detail-top">
        <div className="left">
          <Link href="/studio" className="back">
            <Icon name="arrow-left" size={18} />
            Studio
          </Link>
          <h1 className="detail-title">{clampText(root.prompt, 80)}</h1>
        </div>
        <div className="actions">
          {active.status === 'success' ? (
            <a className="btn" href={`/api/generations/${active.id}/download`} title="Tải phiên bản đang xem">
              <Icon name="download" />
              Tải về
            </a>
          ) : (
            <button type="button" className="btn" disabled>
              <Icon name="download" />
              Tải về
            </button>
          )}
          <Link href={`/studio?reuse=${root.id}`} className="btn">
            <Icon name="pencil" />
            Dùng lại prompt
          </Link>
          <MoreMenu width={290}>
            {(close) => (
              <>
                {active.rootId && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      close();
                      deleteVersion(active);
                    }}
                  >
                    <Icon name="trash" />
                    Xoá phiên bản này
                  </button>
                )}
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    close();
                    deleteAll();
                  }}
                >
                  <Icon name="trash" />
                  {versions.length > 1 ? `Chuyển cả ảnh vào thùng rác (${versions.length} phiên bản)` : 'Chuyển vào thùng rác'}
                </button>
              </>
            )}
          </MoreMenu>
        </div>
      </header>

      <div className="split">
        <div className="stage">
          <div className="stage-media">
            <div className="stage-frame" style={{ ['--r' as string]: String(ratio) }}>
              {active.status === 'success' && active.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.url}
                  alt={active.prompt}
                  onLoad={(e) => setNatural(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))}
                />
              ) : (
                <StatusBlock item={active} now={now} what="ảnh" />
              )}
              <span className="media-label">
                Ảnh{active.params.ratio ? ` · ${ratioLabel(active.params.ratio)}` : ''} · {activeLabel}
              </span>
            </div>
          </div>
          <section className="edit-box" aria-label="Chỉnh sửa ảnh">
            <label htmlFor="gaia-edit" className="sr-only">
              Bạn muốn thay đổi điều gì?
            </label>
            <textarea
              id="gaia-edit"
              rows={2}
              maxLength={2000}
              placeholder="Bạn muốn thay đổi điều gì? (Enter để gửi)"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitEdit();
                }
              }}
            />
            <div className="row-between">
              <div className="row" style={{ gap: 6, fontSize: 13 }}>
                <EditModelChip models={editModels} current={editModel} onPick={(m) => setEditModelId(m.id)} />
                <OptionChip
                  label="Số lượng"
                  value={String(editQty)}
                  options={EDIT_QUANTITIES.map((q) => ({
                    value: q,
                    label: q,
                    price: editCredits != null ? `${fmtNumber(editCredits * Number(q))} credit` : undefined,
                  }))}
                  onPick={(v) => setEditQty(Number(v))}
                />
                <span className="faint">Sửa từ</span>
                <span style={{ fontWeight: 500 }}>{activeLabel}</span>
              </div>
              <div className="row" style={{ gap: 14 }}>
                {editTotal != null && (
                  <span className={`cost${lackingEdit ? ' lacking' : ''}`}>
                    <Icon name="coin" size={14} />
                    {fmtNumber(editTotal)} credit
                  </span>
                )}
                {lackingEdit && canTopup && (
                  <Link href="/credit" className="link-btn">
                    Nạp credit
                  </Link>
                )}
                <button type="button" className="submit" style={{ padding: '0 18px' }} disabled={!canEdit} onClick={submitEdit}>
                  {lackingEdit ? 'Không đủ credit' : editQty > 1 ? `Tạo ${editQty} bản sửa` : 'Tạo bản sửa'}
                  {busy ? <span className="spinner" /> : <Icon name="arrow-right" />}
                </button>
              </div>
            </div>
            {active.status !== 'success' && (
              <div className="faint" style={{ fontSize: 12, padding: '0 6px' }}>
                Chọn một phiên bản đã tạo xong để sửa tiếp.
              </div>
            )}
          </section>
        </div>

        <aside className="side">
          <section>
            <h2>Phiên bản</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedNewestFirst.map((v) => (
                <button key={v.id} type="button" className="ver" aria-pressed={v.id === active.id} onClick={() => setActiveId(v.id)}>
                  {v.status === 'success' && (v.thumbUrl || v.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={v.thumbUrl ?? v.url!} alt="" loading="lazy" />
                  ) : (
                    <span className="thumb">
                      {isRunning(v.status) ? <span className="spinner" /> : <Icon name="alert" className="danger-text" />}
                    </span>
                  )}
                  <span className="txt">
                    <span className="l">{labels.get(v.id)}</span>
                    <span className="p">{v.prompt}</span>
                    <span className="t">
                      {isRunning(v.status)
                        ? 'Đang xử lý…'
                        : v.status === 'error'
                          ? `Lỗi · đã hoàn ${fmtNumber(v.refundedCredits)} credit`
                          : fmtTime(v.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>Thông tin</h2>
            <dl className="info">
              <div>
                <dt>Model</dt>
                <dd>{active.modelName}</dd>
              </div>
              <div>
                <dt>Ratio</dt>
                <dd className="mono">{ratioLabel(active.params.ratio) || '—'}</dd>
              </div>
              <div>
                <dt>Resolution</dt>
                <dd className="mono">{active.params.resolution ? formatOptionValue('resolution', active.params.resolution) : '—'}</dd>
              </div>
              <div>
                <dt>Credit</dt>
                <dd className="mono">
                  {fmtNumber(active.credits - active.refundedCredits)}
                  {versions.length > 1 ? ` · tổng ${fmtNumber(total)}` : ''}
                </dd>
              </div>
              <div>
                <dt>Tạo lúc</dt>
                <dd className="mono">{fmtDayMonthTime(active.createdAt)}</dd>
              </div>
            </dl>
            <div className="prompt-box" style={{ marginTop: 16 }}>
              <div className="head">
                <span>Prompt gốc</span>
                <CopyPromptButton text={root.prompt} />
              </div>
              <p>{root.prompt}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
