'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../Icon';
import { TopBar } from '../TopBar';
import { useCredit } from '../CreditContext';
import { useToasts } from '../Toasts';
import { Composer, currentModel, draftCost, emptyDraft, type Catalog, type Draft, type Upload } from './Composer';
import { detailHref, LibraryCard, TrashCard } from './LibraryCard';
import { SampleMedia } from '../SampleMedia';
import { api, ClientError } from '@/lib/client/api';
import { aspectOf, assertImageFile, fetchImage, prepareImage, uploadDataUrl, uploadImage } from '@/lib/client/upload';
import { priceFor, resolveSelection, selectionFields } from '@/lib/catalog';
import { dayKey, dayLabel, fmtClock, fmtNumber } from '@/lib/format';
import { TRASH_DAYS } from '@/lib/trash';
import { hasSample, ratioValue, SUGGESTION_PAGE, SUGGESTIONS } from '@/lib/suggestions';
import type { GenerationItem, Kind, LibraryItem, Profile } from '@/lib/types';

type Filter = 'all' | Kind | 'trash';

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

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function uploadFrom(ref: { id: string; url: string } | undefined): Upload | null {
  return ref ? { key: ref.id, preview: ref.url, ref, uploading: false } : null;
}

/** Frame của lần tạo trước: giữ URL gốc để kiểm tra (và cắt lại nếu cần) theo tỉ lệ video đang chọn. */
function frameFrom(ref: { id: string; url: string } | undefined): Upload | null {
  return ref ? { key: ref.id, preview: ref.url, ref, uploading: false, source: ref.url } : null;
}

function draftFromItem(catalog: Catalog, base: Draft, item: GenerationItem): Draft {
  const model = catalog[item.kind].find((m) => m.id === item.model);
  return {
    ...base,
    kind: item.kind,
    prompt: item.prompt,
    modelId: model ? { ...base.modelId, [item.kind]: model.id } : base.modelId,
    sel: model ? { ...base.sel, [item.kind]: resolveSelection(model, item.params) } : base.sel,
    start: frameFrom(item.inputs?.start),
    end: frameFrom(item.inputs?.end),
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
  // Chỉ hiện ảnh khi cả trang đều có mẫu, để các thẻ trong lưới cao bằng nhau.
  const withMedia = shown.every(hasSample);
  return (
    <main className="welcome">
      <h1>Ảnh và video bạn tạo sẽ hiện ở đây</h1>
      <p className="muted" style={{ margin: '10px 0 0', fontSize: 16 }}>
        Viết prompt ở khung bên dưới, hoặc lấy một ý tưởng rồi sửa lại theo ý bạn.
      </p>
      <div className="row-between" style={{ margin: '36px 0 14px', gap: 12 }}>
        <h2 className="muted" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Ý tưởng để bắt đầu
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
            {withMedia && hasSample(s) && (
              <span className="frame">
                <span className="media" style={{ '--r': ratioValue(s.sample.ratio) } as CSSProperties}>
                  <SampleMedia s={s} />
                </span>
                {s.sample.duration ? <span className="media-label right">{fmtClock(s.sample.duration)}</span> : null}
              </span>
            )}
            <span className="b">
              <span className="k">
                <Icon name={s.kind === 'video' ? 'video' : 'image'} size={14} />
                {s.kind === 'video' ? 'Video' : 'Ảnh'}
              </span>
              <span className="p">{s.prompt}</span>
              <span className="go">
                <Icon name="pencil" size={14} />
                Dùng prompt này
              </span>
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
  initialTrashCount,
  initialCatalog,
  reuse,
  initialPrompt,
}: {
  profile: Profile;
  initialItems: LibraryItem[];
  initialCursor: string | null;
  initialTrashCount: number;
  initialCatalog: Catalog;
  reuse: GenerationItem | null;
  initialPrompt: { kind: Kind; prompt: string } | null;
}) {
  const { balance, setBalance } = useCredit();
  const { push } = useToasts();
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog);
  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [filter, setFilter] = useState<Filter>('all');
  // Tab mà `items` đang thuộc về. Vừa bấm sang tab khác thì hai giá trị lệch nhau cho tới khi tải xong:
  // lúc đó hiện vòng xoay, không vẽ mục của tab cũ (vd. mục thư viện thành thẻ Thùng rác có nút Khôi phục).
  const [itemsFor, setItemsFor] = useState<Filter>('all');
  const listReq = useRef(0);
  const [loadingList, setLoadingList] = useState(false);
  const [hasAny, setHasAny] = useState(initialItems.length > 0);
  const [trashCount, setTrashCount] = useState(initialTrashCount);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  // Chọn nhiều: `selecting` bật khi bấm "Chọn" hoặc tick một thẻ; `lastPicked` là mốc cho Shift+click chọn cả dãy.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const lastPicked = useRef<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    reuse
      ? draftFromItem(initialCatalog, emptyDraft(), reuse)
      : initialPrompt
        ? { ...emptyDraft(initialPrompt.kind), prompt: initialPrompt.prompt }
        : emptyDraft('video'),
  );
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const running = items.filter((i) => isRunning(i.status));
  const runningCount = running.length;

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
      const req = ++listReq.current;
      setLoadingList(true);
      try {
        const qs = new URLSearchParams();
        if (f === 'trash') qs.set('trash', '1');
        else if (f !== 'all') qs.set('kind', f);
        if (before) qs.set('before', before);
        const res = await api<{ items: LibraryItem[]; nextCursor: string | null; trashCount: number }>(`/api/generations?${qs}`);
        // Đã chuyển tab (hoặc tải lại) trong lúc chờ: bỏ kết quả cũ, không để nó ghi đè tab hiện tại.
        if (req !== listReq.current) return;
        setItems((prev) => (before ? [...prev, ...res.items] : res.items));
        setItemsFor(f);
        setCursor(res.nextCursor);
        setTrashCount(res.trashCount);
      } catch (err) {
        if (req === listReq.current) push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được thư viện' });
      } finally {
        if (req === listReq.current) setLoadingList(false);
      }
    },
    [push],
  );

  const exitSelect = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
    setConfirmPurge(false);
    lastPicked.current = null;
  }, []);

  useEffect(() => {
    if (!selecting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitSelect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecting, exitSelect]);

  const changeFilter = (f: Filter) => {
    if (f === filter) return;
    setFilter(f);
    setConfirmEmpty(false);
    exitSelect();
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

  // Prompt mang từ trang chủ sang: đặt con trỏ vào khung soạn, rồi bỏ khỏi URL để tải lại trang không điền lại.
  useEffect(() => {
    if (!initialPrompt) return;
    window.history.replaceState(null, '', '/studio');
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [initialPrompt]);

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
      setTrashCount((n) => n + 1);
      push({
        title: 'Đã chuyển vào thùng rác',
        sub: `Tự xoá vĩnh viễn sau ${TRASH_DAYS} ngày`,
        action: {
          label: 'Hoàn tác',
          onClick: async () => {
            try {
              await api(`/api/generations/${res.rootId}/restore`, { method: 'POST', json: { deletedAt: res.deletedAt } });
              setTrashCount((n) => Math.max(0, n - 1));
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

  // ── Thùng rác ──
  const restoreItem = async (item: LibraryItem) => {
    try {
      await api(`/api/generations/${item.id}/restore`, { method: 'POST', json: {} });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTrashCount((n) => Math.max(0, n - 1));
      setHasAny(true);
      push({ title: 'Đã khôi phục vào thư viện' });
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không khôi phục được' });
    }
  };

  const purgeItem = async (item: LibraryItem) => {
    try {
      await api(`/api/generations/${item.id}?scope=permanent`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setTrashCount((n) => Math.max(0, n - 1));
      push({ title: 'Đã xoá vĩnh viễn' });
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không xoá được' });
    }
  };

  const emptyTrash = async () => {
    setConfirmEmpty(false);
    try {
      const res = await api<{ deleted: number }>('/api/generations/trash', { method: 'DELETE' });
      push({ title: res.deleted ? `Đã xoá vĩnh viễn ${fmtNumber(res.deleted)} mục` : 'Thùng rác đã trống' });
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không dọn được thùng rác' });
    }
    loadList('trash');
  };

  // ── Chọn nhiều ──
  // Thư viện: mục đang tạo không chọn được (giống thẻ của nó không có nút xoá). Thùng rác: chọn được mọi mục.
  const canSelect = useCallback((it: LibraryItem) => filter === 'trash' || !isRunning(it.status), [filter]);
  const itemsForRef = useRef(itemsFor);
  useEffect(() => {
    itemsForRef.current = itemsFor;
  }, [itemsFor]);

  const toggleSelect = useCallback(
    (item: LibraryItem, range: boolean) => {
      if (!canSelect(item)) return;
      const list = itemsRef.current;
      const from = range && lastPicked.current ? list.findIndex((i) => i.id === lastPicked.current) : -1;
      const to = list.findIndex((i) => i.id === item.id);
      setSelecting(true);
      setConfirmPurge(false);
      setSelected((prev) => {
        const next = new Set(prev);
        if (from >= 0 && to >= 0) {
          const [a, b] = from < to ? [from, to] : [to, from];
          for (const it of list.slice(a, b + 1)) if (canSelect(it)) next.add(it.id);
        } else if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      lastPicked.current = item.id;
    },
    [canSelect],
  );

  const trashPicked = async () => {
    const tab = itemsForRef.current;
    const removed = itemsRef.current.map((it, index) => ({ it, index })).filter(({ it }) => selected.has(it.id) && canSelect(it));
    if (!removed.length) return;
    const ids = removed.map(({ it }) => it.id);
    // Đặt lại đúng vị trí cũ; nếu đã sang tab khác thì tải lại tab đang xem thay vì chèn thẻ thư viện vào đó.
    const putBack = () => {
      if (itemsForRef.current !== tab) {
        loadList(itemsForRef.current);
        return;
      }
      setItems((prev) => {
        const next = [...prev];
        for (const { it, index } of removed) if (!next.some((i) => i.id === it.id)) next.splice(Math.min(index, next.length), 0, it);
        return next;
      });
    };
    exitSelect();
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    try {
      const res = await api<{ rootIds: string[]; deletedAt: string }>('/api/generations/bulk', { method: 'POST', json: { action: 'trash', ids } });
      setTrashCount((n) => n + res.rootIds.length);
      push({
        title: `Đã chuyển ${fmtNumber(ids.length)} mục vào thùng rác`,
        sub: `Tự xoá vĩnh viễn sau ${TRASH_DAYS} ngày`,
        action: {
          label: 'Hoàn tác',
          onClick: async () => {
            try {
              const undo = await api<{ restored: number }>('/api/generations/bulk', {
                method: 'POST',
                json: { action: 'restore', ids: res.rootIds, deletedAt: res.deletedAt },
              });
              setTrashCount((n) => Math.max(0, n - undo.restored));
              if (undo.restored === res.rootIds.length) putBack();
              else {
                // Có mục đã bị đổi trong lúc chờ (vd. xoá vĩnh viễn ở tab khác): tải lại cho đúng thực tế.
                loadList(itemsForRef.current);
                if (!undo.restored) push({ kind: 'error', title: 'Không hoàn tác được' });
              }
            } catch (err) {
              push({ kind: 'error', title: err instanceof Error ? err.message : 'Không hoàn tác được' });
            }
          },
        },
      });
    } catch (err) {
      putBack();
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không xoá được' });
    }
  };

  const restorePicked = async () => {
    const ids = itemsRef.current.filter((i) => selected.has(i.id)).map((i) => i.id);
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await api<{ restored: number }>('/api/generations/bulk', { method: 'POST', json: { action: 'restore', ids } });
      exitSelect();
      setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
      setTrashCount((n) => Math.max(0, n - res.restored));
      setHasAny(true);
      push({ title: `Đã khôi phục ${fmtNumber(res.restored)} mục vào thư viện` });
      if (res.restored < ids.length) loadList('trash');
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không khôi phục được' });
    } finally {
      setBulkBusy(false);
    }
  };

  const purgePicked = async () => {
    const picked = itemsRef.current.filter((i) => selected.has(i.id));
    const ids = picked.filter((i) => !isRunning(i.status)).map((i) => i.id);
    const skipped = picked.length - ids.length;
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await api<{ deletedIds: string[] }>('/api/generations/bulk', { method: 'POST', json: { action: 'purge', ids } });
      exitSelect();
      setItems((prev) => prev.filter((i) => !res.deletedIds.includes(i.id)));
      setTrashCount((n) => Math.max(0, n - res.deletedIds.length));
      push({
        title: `Đã xoá vĩnh viễn ${fmtNumber(res.deletedIds.length)} mục`,
        sub: skipped ? `Bỏ qua ${fmtNumber(skipped)} mục đang tạo dở` : undefined,
      });
    } catch (err) {
      setConfirmPurge(false);
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không xoá được' });
    } finally {
      setBulkBusy(false);
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

  // Tỉ lệ video đang chọn. Start/End frame được cắt phần giữa theo tỉ lệ này, vì Gommo/Veo không tự cắt
  // mà chèn viền đen (kiểm chứng 2026-10-11: ảnh 3:2 trong video 16:9).
  const videoModel = currentModel(catalog, draft, 'video');
  const videoRatio = videoModel ? resolveSelection(videoModel, draft.sel.video).ratio : undefined;

  /** Cắt ảnh frame cho đúng `ratio` rồi tải lên. Frame cũ trên CDN đã đúng tỉ lệ thì dùng lại, khỏi tải lên. */
  const processFrame = useCallback(
    (slot: 'start' | 'end', source: File | string, ratio: string | undefined, current?: Upload) => {
      const key = newKey();
      const preview = typeof source === 'string' ? (current?.preview ?? source) : URL.createObjectURL(source);
      const up: Upload = { key, preview, uploading: true, source, ratio };
      setDraft((d) => (slot === 'start' ? { ...d, start: up } : { ...d, end: up }));
      const fileName = typeof source === 'string' ? source.split('/').pop() || 'frame.jpg' : source.name;
      (async () => {
        const prepared = await prepareImage(typeof source === 'string' ? await fetchImage(source) : source, aspectOf(ratio));
        if (!prepared.changed && typeof source === 'string' && current?.ref) return { ref: current.ref, cropped: false };
        setDraft((d) => patchUpload(d, key, { preview: prepared.dataUrl, cropped: prepared.cropped }));
        return { ref: await uploadDataUrl(prepared.dataUrl, fileName), cropped: prepared.cropped };
      })()
        .then(({ ref, cropped }) => setDraft((d) => patchUpload(d, key, { ref, cropped, uploading: false })))
        .catch((err) => {
          setDraft((d) => patchUpload(d, key, null));
          push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được ảnh lên' });
        });
    },
    [push],
  );

  // Đổi tỉ lệ (hoặc model) sau khi đã thêm frame, hoặc frame lấy từ lần tạo trước: cắt lại từ ảnh gốc.
  const { start: startFrame, end: endFrame } = draft;
  useEffect(() => {
    for (const [slot, up] of [['start', startFrame], ['end', endFrame]] as const) {
      if (up?.source === undefined || up.uploading || up.ratio === videoRatio) continue;
      // Việc cắt + tải lên là bất đồng bộ; processFrame đánh dấu frame "đang xử lý" ngay để effect không chạy trùng.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      processFrame(slot, up.source, videoRatio, up);
    }
  }, [videoRatio, startFrame, endFrame, processFrame]);

  const onPickFile = (slot: 'start' | 'end' | 'ref', file: File) => {
    try {
      assertImageFile(file);
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được ảnh lên' });
      return;
    }
    if (slot !== 'ref') {
      processFrame(slot, file, videoRatio);
      return;
    }
    const key = newKey();
    const up: Upload = { key, preview: URL.createObjectURL(file), uploading: true };
    setDraft((d) => ({ ...d, refs: [...d.refs, up] }));
    uploadImage(file)
      .then((ref) => setDraft((d) => patchUpload(d, key, { ref, uploading: false })))
      .catch((err) => {
        setDraft((d) => patchUpload(d, key, null));
        push({ kind: 'error', title: err instanceof Error ? err.message : 'Không tải được ảnh lên' });
      });
  };

  // Dán ảnh (Ctrl+V) vào ô prompt: ảnh → Reference; video → Start frame rồi End frame.
  const pasteImages = (files: File[]) => {
    const m = currentModel(catalog, draft);
    if (!m) return;
    if (draft.kind === 'image') {
      const free = m.maxReferences - draft.refs.length;
      if (m.maxReferences === 0) {
        push({ title: `${m.name} không dùng ảnh Reference. Bạn chọn model khác để dán ảnh.` });
        return;
      }
      if (free <= 0) {
        push({ title: `${m.name} nhận tối đa ${m.maxReferences} ảnh Reference. Xoá bớt một ảnh rồi dán lại.` });
        return;
      }
      files.slice(0, free).forEach((f) => onPickFile('ref', f));
      if (files.length > free) push({ title: `Chỉ thêm được ${free} ảnh. ${m.name} nhận tối đa ${m.maxReferences} ảnh Reference.` });
      return;
    }
    if (!m.frames.start) {
      push({ title: `${m.name} không dùng ảnh khung (frame). Bạn chọn model khác để dán ảnh.` });
      return;
    }
    const slots: ('start' | 'end')[] = [];
    if (!draft.start) slots.push('start');
    if (m.frames.end && !draft.end) slots.push('end');
    if (!slots.length) {
      push({ title: m.frames.end ? 'Đã có Start frame và End frame. Xoá bớt một ảnh rồi dán lại.' : 'Đã có Start frame. Xoá ảnh cũ rồi dán lại.' });
      return;
    }
    files.slice(0, slots.length).forEach((f, i) => onPickFile(slots[i], f));
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

  const firstRun = !hasAny && filter === 'all' && items.length === 0 && trashCount === 0;
  const inTrash = filter === 'trash';
  const stale = itemsFor !== filter;
  const model = currentModel(catalog, draft);
  const selectable = stale ? [] : items.filter(canSelect);
  const picked = items.filter((i) => selected.has(i.id));
  const allPicked = selectable.length > 0 && picked.length === selectable.length;
  const purgeCount = picked.filter((i) => !isRunning(i.status)).length;
  const selectFor = (it: LibraryItem) =>
    canSelect(it) ? { active: selecting, selected: selected.has(it.id), onToggle: toggleSelect } : undefined;

  return (
    <div className="page">
      <TopBar profile={profile} />

      {firstRun ? (
        <Welcome onPick={pickSuggestion} />
      ) : (
        <>
          {selecting ? (
            <div className="lib-toolbar select-bar" role="toolbar" aria-label="Thao tác với các mục đã chọn">
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="icon-ghost" aria-label="Thoát chọn" title="Thoát chọn (Esc)" onClick={exitSelect}>
                  <Icon name="x" size={18} />
                </button>
                <span className="select-count" aria-live="polite">
                  Đã chọn <span className="mono">{fmtNumber(picked.length)}</span>
                </span>
                <button
                  type="button"
                  className="text-btn"
                  disabled={!selectable.length}
                  onClick={() => setSelected(allPicked ? new Set() : new Set(selectable.map((i) => i.id)))}
                >
                  {allPicked ? 'Bỏ chọn tất cả' : cursor ? 'Chọn tất cả đang hiện' : 'Chọn tất cả'}
                </button>
              </div>
              <div className="row trash-tools">
                {!inTrash ? (
                  <button type="button" className="mini-btn danger-ghost" disabled={!picked.length} onClick={trashPicked}>
                    <Icon name="trash" size={14} />
                    Chuyển vào thùng rác
                  </button>
                ) : confirmPurge ? (
                  <>
                    <span className="danger-text" style={{ fontSize: 13, fontWeight: 500 }}>
                      Xoá vĩnh viễn {fmtNumber(purgeCount)} mục?
                    </span>
                    <button type="button" className="mini-btn danger-fill" disabled={bulkBusy} onClick={purgePicked}>
                      Xoá
                    </button>
                    <button type="button" className="mini-btn" disabled={bulkBusy} onClick={() => setConfirmPurge(false)}>
                      Huỷ
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="mini-btn" disabled={!picked.length || bulkBusy} onClick={restorePicked}>
                      <Icon name="undo" size={14} />
                      Khôi phục
                    </button>
                    <button
                      type="button"
                      className="mini-btn danger-ghost"
                      disabled={!purgeCount || bulkBusy}
                      title={picked.length && !purgeCount ? 'Đợi tạo xong rồi hãy xoá vĩnh viễn' : undefined}
                      onClick={() => setConfirmPurge(true)}
                    >
                      <Icon name="trash" size={14} />
                      Xoá vĩnh viễn
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
          <div className="lib-toolbar">
            <nav aria-label="Lọc thư viện" style={{ display: 'flex', flexWrap: 'wrap', gap: '0 24px' }}>
              {(['all', 'image', 'video', 'trash'] as Filter[]).map((f) => (
                <button key={f} type="button" className="tab" aria-pressed={filter === f} onClick={() => changeFilter(f)}>
                  {f === 'all' ? 'Tất cả' : f === 'image' ? 'Ảnh' : f === 'video' ? 'Video' : 'Thùng rác'}
                  {f === 'trash' && trashCount > 0 && <span className="tab-count">{fmtNumber(trashCount)}</span>}
                </button>
              ))}
            </nav>
            <div className="row" style={{ gap: 12 }}>
              {!inTrash && runningCount > 0 && (
                <div className="running">
                  <span className="pulse-dot" />
                  {runningCount} đang chạy
                </div>
              )}
              {selectable.length > 0 && !confirmEmpty && (
                <button type="button" className="mini-btn select-start" onClick={() => setSelecting(true)}>
                  <Icon name="check" size={14} />
                  Chọn
                </button>
              )}
              {inTrash && !stale && items.length > 0 && (
                <div className="row trash-tools">
                  {confirmEmpty ? (
                    <>
                      <span className="danger-text" style={{ fontSize: 13, fontWeight: 500 }}>
                        Xoá vĩnh viễn mọi mục trong thùng rác?
                      </span>
                      <button type="button" className="mini-btn danger-fill" onClick={emptyTrash}>
                        Xoá hết
                      </button>
                      <button type="button" className="mini-btn" onClick={() => setConfirmEmpty(false)}>
                        Huỷ
                      </button>
                    </>
                  ) : (
                    <button type="button" className="mini-btn danger-ghost" onClick={() => setConfirmEmpty(true)}>
                      <Icon name="trash" size={14} />
                      Dọn thùng rác
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          <main className={`lib-main${selecting ? ' selecting' : ''}`} aria-busy={loadingList}>
            {inTrash && (
              <p className="trash-note">
                Ảnh và video trong thùng rác tự xoá vĩnh viễn sau {TRASH_DAYS} ngày. Khôi phục để đưa lại vào thư viện.
              </p>
            )}
            {stale && (
              <div className="list-loading" role="status">
                <span className="spinner" aria-hidden="true" />
                <span className="sr-only">Đang tải…</span>
              </div>
            )}
            {!stale && items.length === 0 && !loadingList && (
              <div className="empty-note" style={{ padding: '64px 0' }}>
                {inTrash
                  ? 'Thùng rác trống.'
                  : filter === 'image'
                    ? 'Chưa có ảnh nào.'
                    : filter === 'video'
                      ? 'Chưa có video nào.'
                      : 'Thư viện đang trống.'}
              </div>
            )}
            {inTrash && !stale && items.length > 0 && (
              <div className="lib-grid" style={{ marginTop: 16 }}>
                {items.map((it) => (
                  <TrashCard key={it.id} item={it} now={now} onRestore={restoreItem} onPurge={purgeItem} select={selectFor(it)!} />
                ))}
              </div>
            )}
            {!inTrash && !stale && groups.map((g) => (
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
                      select={selectFor(it)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {!stale && cursor && (
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
          onPasteImages={pasteImages}
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
