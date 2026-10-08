'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { TopBar } from '../TopBar';
import { useCredit } from '../CreditContext';
import { useToasts } from '../Toasts';
import { Composer, currentModel, draftCost, emptyDraft, type Catalog, type Draft, type Upload } from './Composer';
import { detailHref, LibraryCard } from './LibraryCard';
import { api, ClientError } from '@/lib/client/api';
import { uploadImage } from '@/lib/client/upload';
import { priceFor, resolveSelection, selectionFields } from '@/lib/catalog';
import { dayKey, dayLabel, fmtNumber } from '@/lib/format';
import { SUGGESTION_PAGE, SUGGESTIONS } from '@/lib/suggestions';
import type { GenerationItem, Kind, LibraryItem, Profile } from '@/lib/types';

type Filter = 'all' | Kind;
type Fit = 'contain' | 'cover';

const isRunning = (s: GenerationItem['status']) => s === 'pending' || s === 'processing';

function toLibraryItem(g: GenerationItem): LibraryItem {
  return {
    ...g,
    versionCount: 1,
    totalCredits: g.credits - g.refundedCredits,
    displayId: g.status === 'success' ? g.id : null,
    displayUrl: g.status === 'success' ? g.url : null,
    displayThumbUrl: g.status === 'success' ? g.thumbUrl ?? g.url : null,
  };
}

function uploadFrom(ref: { id: string; url: string } | undefined): Upload | null {
  return ref ? { key: ref.id, preview: ref.url, ref, uploading: false } : null;
}

function draftFromItem(catalog: Catalog, base: Draft, item: GenerationItem): Draft {
  const model = catalog[item.kind].find((m) => m.id === item.model);
  return {
    ...base,
    kind: item.kind,
    prompt: item.prompt,
    modelId: model ? { ...base.modelId, [item.kind]: model.id } : base.modelId,
    sel: model ? { ...base.sel, [item.kind]: resolveSelection(model, item.params) } : base.sel,
    start: uploadFrom(item.inputs?.start),
    end: uploadFrom(item.inputs?.end),
    refs: (item.inputs?.references ?? []).map((r) => uploadFrom(r)!),
    quantity: 1,
  };
}

function patchUpload(d: Draft, key: string, patch: Partial<Upload> | null): Draft {
  const apply = (u: Upload | null) => (u && u.key === key ? (patch ? { ...u, ...patch } : null) : u);
  return {
    ...d,
    start: apply(d.start),
    end: patch === null && d.start?.key === key ? null : apply(d.end),
    refs: d.refs.map((r) => apply(r)).filter((r): r is Upload => r !== null),
  };
}

function Welcome({ onPick }: { onPick: (kind: Kind, prompt: string) => void }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(SUGGESTIONS.length / SUGGESTION_PAGE);
  const shown = SUGGESTIONS.slice(page * SUGGESTION_PAGE, page * SUGGESTION_PAGE + SUGGESTION_PAGE);
  return (
    <main className="welcome">
      <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em' }}>Chào mừng đến GAIA Studio</h1>
      <p className="muted" style={{ margin: '10px 0 0', fontSize: 16 }}>
        Chọn một ý tưởng để dùng ngay, hoặc tự viết prompt ở khung bên dưới.
      </p>
      <div className="row-between" style={{ margin: '36px 0 14px', gap: 12 }}>
        <h2 className="muted" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Ý tưởng gợi ý
        </h2>
        <button
          type="button"
          className="dashed"
          style={{ borderStyle: 'solid', borderColor: '#2E2E29', color: '#EDEBE6' }}
          onClick={() => setPage((p) => (p + 1) % pages)}
        >
          <Icon name="refresh" />
          Gợi ý khác
        </button>
      </div>
      <div className="suggest-grid">
        {shown.map((s) => (
          <button type="button" className="suggest" key={s.prompt} onClick={() => onPick(s.kind, s.prompt)}>
            <span className="img" style={{ background: s.tone }}>
              <Icon name={s.kind === 'video' ? 'video' : 'image'} size={28} />
              <span className="media-label">{s.kind === 'video' ? 'VIDEO' : 'ẢNH'}</span>
            </span>
            <span className="b">
              <span className="p">{s.prompt}</span>
              <span className="s">{s.kind === 'video' ? 'Video' : 'Ảnh'} · Dùng prompt này →</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

export function StudioApp({
  profile,
  initialItems,
  initialCursor,
  initialCatalog,
  reuse,
}: {
  profile: Profile;
  initialItems: LibraryItem[];
  initialCursor: string | null;
  initialCatalog: Catalog;
  reuse: GenerationItem | null;
}) {
  const { balance, setBalance } = useCredit();
  const { push } = useToasts();
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog);
  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [filter, setFilter] = useState<Filter>('all');
  const [loadingList, setLoadingList] = useState(false);
  const [hasAny, setHasAny] = useState(initialItems.length > 0);
  const [fit, setFit] = useState<Fit>('contain');
  const [now, setNow] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    reuse ? draftFromItem(initialCatalog, emptyDraft(), reuse) : emptyDraft('video'),
  );
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const running = items.filter((i) => isRunning(i.status));
  const runningCount = running.length;

  // Ghi nhớ "Trọn khung / Lấp đầy" trên máy người dùng.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem('gaia-fit') === 'cover') setFit('cover');
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const changeFit = (f: Fit) => {
    setFit(f);
    try {
      localStorage.setItem('gaia-fit', f);
    } catch {}
  };

  // Đồng hồ cho thẻ đang chạy (chỉ chạy sau khi mount để server/client render giống nhau).
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = runningCount ? setInterval(() => setNow(Date.now()), 1000) : undefined;
    return () => {
      clearTimeout(first);
      if (t) clearInterval(t);
    };
  }, [runningCount]);

  const refreshCatalog = useCallback(() => {
    api<Catalog>('/api/models')
      .then(setCatalog)
      .catch(() => {});
  }, []);

  // Hỏi trạng thái job đang chạy; báo khi xong (chỉ khi GAIA đang mở).
  useEffect(() => {
    if (!runningCount) return;
    let stopped = false;
    let tick = 0;
    const sync = async () => {
      tick++;
      if (document.visibilityState === 'hidden' && tick % 4 !== 0) return;
      try {
        const res = await api<{ items: GenerationItem[]; balance: number }>('/api/generations/sync', { method: 'POST' });
        if (stopped) return;
        setBalance(res.balance);
        const byId = new Map(res.items.map((g) => [g.id, g]));
        for (const old of itemsRef.current) {
          const fresh = byId.get(old.id);
          if (!fresh || !isRunning(old.status) || isRunning(fresh.status)) continue;
          const label = old.kind === 'video' ? 'Video' : 'Ảnh';
          if (fresh.status === 'success') {
            push({ kind: 'done', title: `${label} đã tạo xong`, sub: old.prompt, action: { label: 'Xem', href: detailHref(old) } });
          } else {
            push({
              kind: 'error',
              title: `Không tạo được ${label.toLowerCase()}`,
              sub: fresh.refundedCredits ? `Đã hoàn ${fmtNumber(fresh.refundedCredits)} credit` : old.prompt,
            });
          }
        }
        // Job không còn trong danh sách đang chạy mà server không trả về (đã xong từ trước) thì cập nhật luôn.
        setItems((prev) =>
          prev.map((it) => {
            const fresh = byId.get(it.id);
            if (!fresh) return it;
            const merged = { ...it, ...fresh };
            if (fresh.status === 'success' && it.versionCount <= 1) {
              merged.displayId = fresh.id;
              merged.displayUrl = fresh.url;
              merged.displayThumbUrl = fresh.thumbUrl ?? fresh.url;
              merged.totalCredits = fresh.credits - fresh.refundedCredits;
            }
            return merged;
          }),
        );
        // Những thẻ đang chạy mà server không còn coi là đang chạy: tải lại để lấy trạng thái cuối.
        const stale = itemsRef.current.filter((i) => isRunning(i.status) && !byId.has(i.id));
        if (stale.length) {
          const details = await Promise.all(
            stale.map((s) => api<{ root: GenerationItem }>(`/api/generations/${s.id}`).catch(() => null)),
          );
          setItems((prev) =>
            prev.map((it) => {
              const d = details.find((x) => x?.root.id === it.id);
              return d ? { ...it, ...toLibraryItem(d.root), versionCount: it.versionCount } : it;
            }),
          );
        }
      } catch {
        // Lỗi mạng tạm thời: lần sau thử lại.
      }
    };
    sync();
    const t = setInterval(sync, 4000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [runningCount, push, setBalance]);

  const loadList = useCallback(
    async (f: Filter, before?: string) => {
      setLoadingList(true);
      try {
        const qs = new URLSearchParams();
        if (f !== 'all') qs.set('kind', f);
        if (before) qs.set('before', before);
        const res = await api<{ items: LibraryItem[]; nextCursor: string | null }>(`/api/generations?${qs}`);
        setItems((prev) => (before ? [...prev, ...res.items] : res.items));
        setCursor(res.nextCursor);
      } catch (err) {
        push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được thư viện' });
      } finally {
        setLoadingList(false);
      }
    },
    [push],
  );

  const changeFilter = (f: Filter) => {
    if (f === filter) return;
    setFilter(f);
    loadList(f);
  };

  const focusPrompt = () => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    });
  };

  const reusePrompt = (item: GenerationItem) => {
    const model = catalog[item.kind].find((m) => m.id === item.model);
    setDraft((d) => draftFromItem(catalog, d, item));
    if (!model) push({ title: `${item.modelName} không còn trong danh sách. Đã giữ prompt, bạn chọn model khác nhé.` });
    focusPrompt();
  };

  const copyPrompt = (item: GenerationItem) => {
    navigator.clipboard
      .writeText(item.prompt)
      .then(() => push({ title: 'Đã sao chép prompt' }))
      .catch(() => push({ kind: 'error', title: 'Không sao chép được prompt' }));
  };

  const removeItem = async (item: LibraryItem) => {
    const index = itemsRef.current.findIndex((i) => i.id === item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      const res = await api<{ rootId: string; deletedAt: string }>(`/api/generations/${item.id}`, { method: 'DELETE' });
      push({
        title: 'Đã xoá khỏi thư viện',
        action: {
          label: 'Hoàn tác',
          onClick: async () => {
            try {
              await api(`/api/generations/${res.rootId}/restore`, { method: 'POST', json: { deletedAt: res.deletedAt } });
              setItems((prev) => {
                if (prev.some((i) => i.id === item.id)) return prev;
                const next = [...prev];
                next.splice(Math.min(index, next.length), 0, item);
                return next;
              });
            } catch (err) {
              push({ kind: 'error', title: err instanceof Error ? err.message : 'Không hoàn tác được' });
            }
          },
        },
      });
    } catch (err) {
      setItems((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, item);
        return next;
      });
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không xoá được' });
    }
  };

  const retryCreditsFor = useCallback(
    (item: LibraryItem): number | null => {
      const model = catalog[item.kind].find((m) => m.id === item.model);
      if (!model || !model.available) return null;
      const resolved = resolveSelection(model, item.params);
      if (selectionFields(model).some((f) => resolved[f] !== item.params[f])) return null;
      return priceFor(model, resolved);
    },
    [catalog],
  );

  const handleError = (err: unknown) => {
    if (err instanceof ClientError) {
      if (err.code === 'insufficient_credits') {
        push({ kind: 'error', title: err.message, action: { label: 'Nạp credit', href: '/credit' } });
        return;
      }
      if (err.code === 'price_changed' || err.code === 'params_changed' || err.code === 'model_unavailable') refreshCatalog();
      push({ kind: 'error', title: err.message });
      return;
    }
    push({ kind: 'error', title: 'Có lỗi xảy ra. Bạn thử lại sau ít phút.' });
  };

  const addCreated = (created: GenerationItem[]) => {
    const kind = created[0]?.kind;
    setHasAny(true);
    if (filter !== 'all' && kind && filter !== kind) {
      setFilter('all');
      loadList('all');
      return;
    }
    setItems((prev) => [...created.map(toLibraryItem), ...prev]);
    const failed = created.filter((c) => c.status === 'error');
    if (failed.length) {
      push({
        kind: 'error',
        title: `Không gửi được yêu cầu tạo ${kind === 'video' ? 'video' : 'ảnh'}`,
        sub: `Đã hoàn ${fmtNumber(failed.reduce((s, f) => s + f.refundedCredits, 0))} credit`,
      });
    }
  };

  const retry = async (item: LibraryItem) => {
    const credits = retryCreditsFor(item);
    if (credits == null) return;
    try {
      const res = await api<{ items: GenerationItem[]; balance: number }>(`/api/generations/${item.id}/rerun`, {
        method: 'POST',
        json: { expectedCredits: credits },
      });
      setBalance(res.balance);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      addCreated(res.items);
    } catch (err) {
      handleError(err);
    }
  };

  const submit = async () => {
    const { model, sel, unit, qty } = draftCost(catalog, draft);
    if (!model || unit == null || submitting) return;
    setSubmitting(true);
    try {
      const inputs =
        draft.kind === 'video'
          ? { start: draft.start?.ref, end: draft.end?.ref }
          : { references: draft.refs.map((r) => r.ref).filter((r): r is NonNullable<typeof r> => Boolean(r)) };
      const res = await api<{ items: GenerationItem[]; balance: number }>('/api/generations', {
        method: 'POST',
        json: { kind: draft.kind, model: model.id, prompt: draft.prompt, params: sel, quantity: qty, inputs, expectedCredits: unit },
      });
      setBalance(res.balance);
      addCreated(res.items);
      setDraft((d) => ({ ...d, prompt: '', start: null, end: null, refs: [] }));
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onPickFile = (slot: 'start' | 'end' | 'ref', file: File) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const up: Upload = { key, preview: URL.createObjectURL(file), uploading: true };
    setDraft((d) => (slot === 'start' ? { ...d, start: up } : slot === 'end' ? { ...d, end: up } : { ...d, refs: [...d.refs, up] }));
    uploadImage(file)
      .then((ref) => setDraft((d) => patchUpload(d, key, { ref, uploading: false })))
      .catch((err) => {
        setDraft((d) => patchUpload(d, key, null));
        push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được ảnh lên' });
      });
  };

  const pickSuggestion = (kind: Kind, prompt: string) => {
    setDraft((d) => ({ ...d, kind, prompt }));
    focusPrompt();
  };

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: LibraryItem[] }[] = [];
    for (const it of items) {
      const key = dayKey(it.createdAt);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(it);
      else out.push({ key, label: dayLabel(it.createdAt), items: [it] });
    }
    return out;
  }, [items]);

  const firstRun = !hasAny && filter === 'all' && items.length === 0;
  const model = currentModel(catalog, draft);

  return (
    <div className="page">
      <TopBar profile={profile} />

      {firstRun ? (
        <Welcome onPick={pickSuggestion} />
      ) : (
        <>
          <div className="lib-toolbar">
            <nav aria-label="Lọc thư viện" style={{ display: 'flex', gap: 24 }}>
              {(['all', 'image', 'video'] as Filter[]).map((f) => (
                <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => changeFilter(f)}>
                  {f === 'all' ? 'Tất cả' : f === 'image' ? 'Ảnh' : 'Video'}
                </button>
              ))}
            </nav>
            <div className="row" style={{ gap: 12 }}>
              {runningCount > 0 && (
                <div className="running">
                  <span className="pulse-dot" />
                  {runningCount} đang chạy
                </div>
              )}
              <div className="fit-toggle" role="group" aria-label="Cách hiện ảnh trong ô">
                <button
                  type="button"
                  aria-pressed={fit === 'contain'}
                  title="Hiện trọn ảnh/video trong ô, không cắt"
                  onClick={() => changeFit('contain')}
                >
                  Trọn khung
                </button>
                <button
                  type="button"
                  aria-pressed={fit === 'cover'}
                  title="Lấp đầy ô, phần thừa bị cắt bớt"
                  onClick={() => changeFit('cover')}
                >
                  Lấp đầy
                </button>
              </div>
            </div>
          </div>

          <main className={`lib-main${fit === 'cover' ? ' lib-fill' : ''}`} aria-busy={loadingList}>
            {items.length === 0 && !loadingList && (
              <div className="empty-note" style={{ padding: '64px 0' }}>
                {filter === 'image' ? 'Chưa có ảnh nào.' : filter === 'video' ? 'Chưa có video nào.' : 'Thư viện đang trống.'}
              </div>
            )}
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label}>
                <h2 className="group-title">{g.label}</h2>
                <div className="lib-grid">
                  {g.items.map((it) => (
                    <LibraryCard
                      key={it.id}
                      item={it}
                      now={now}
                      retryCredits={it.status === 'error' ? retryCreditsFor(it) : null}
                      onReuse={reusePrompt}
                      onCopy={copyPrompt}
                      onDelete={removeItem}
                      onRetry={retry}
                    />
                  ))}
                </div>
              </section>
            ))}
            {cursor && (
              <button type="button" className="more-btn" disabled={loadingList} onClick={() => loadList(filter, cursor)}>
                {loadingList ? 'Đang tải…' : 'Xem thêm'}
              </button>
            )}
          </main>
        </>
      )}

      {model || catalog.image.length || catalog.video.length ? (
        <Composer
          catalog={catalog}
          draft={draft}
          setDraft={setDraft}
          balance={balance}
          submitting={submitting}
          onSubmit={submit}
          onPickFile={onPickFile}
          textareaRef={textareaRef}
        />
      ) : (
        <div className="dock">
          <div className="composer empty-note">Chưa tải được danh sách model. Bạn tải lại trang sau ít phút.</div>
        </div>
      )}
      <div className="dock-spacer" />
    </div>
  );
}
