'use client';

import Link from 'next/link';
import { useCallback, useRef, useState, type MouseEvent } from 'react';
import { Icon } from '../Icon';
import { useDismiss } from '../useDismiss';
import { paramSummary, ratioLabel, ratioNumber } from '@/lib/catalog';
import { fmtClock, fmtElapsed, fmtNumber } from '@/lib/format';
import { trashDaysLeft } from '@/lib/trash';
import type { LibraryItem } from '@/lib/types';

export function detailHref(item: { id: string; kind: 'image' | 'video' }) {
  return item.kind === 'video' ? `/studio/video/${item.id}` : `/studio/image/${item.id}`;
}

function CreditUsed({ value, title }: { value: number; title: string }) {
  return (
    <span className="credit-used" title={title}>
      <Icon name="coin" size={12} />
      {fmtNumber(value)}
      <span className="sr-only"> credit</span>
    </span>
  );
}

/** Chọn nhiều: bấm ô tick để chọn/bỏ chọn; giữ Shift để chọn cả dãy từ mục bấm lần trước. */
export type Selection = {
  active: boolean;
  selected: boolean;
  onToggle: (item: LibraryItem, range: boolean) => void;
};

function SelectBox({ item, select }: { item: LibraryItem; select: Selection }) {
  return (
    <button
      type="button"
      className="select-box"
      role="checkbox"
      aria-checked={select.selected}
      aria-label={select.selected ? 'Bỏ chọn' : 'Chọn'}
      title={select.selected ? 'Bỏ chọn' : 'Chọn'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        select.onToggle(item, e.shiftKey);
      }}
    >
      <span className="box">{select.selected && <Icon name="check" size={14} />}</span>
    </button>
  );
}

function Media({ item }: { item: LibraryItem }) {
  const fixed = item.params.ratio && item.params.ratio.toLowerCase() !== 'auto';
  const [ratio, setRatio] = useState(fixed ? ratioNumber(item.params.ratio) : 1);
  const src = item.kind === 'video' ? item.thumbUrl : item.displayThumbUrl ?? item.displayUrl;
  const onSize = (w: number, h: number) => {
    if (!fixed && w > 0 && h > 0) setRatio(w / h);
  };
  return (
    <div className="media" style={{ ['--r' as string]: String(ratio) }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onLoad={(e) => onSize(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} />
      ) : item.kind === 'video' && item.url ? (
        <video
          src={item.url}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={(e) => onSize(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
        />
      ) : null}
      {item.kind === 'video' && (
        <span className="play-badge">
          <Icon name="play" size={20} />
        </span>
      )}
    </div>
  );
}

export function LibraryCard({
  item,
  now,
  retryCredits,
  onReuse,
  onCopy,
  onDelete,
  onRetry,
  select,
}: {
  item: LibraryItem;
  now: number | null;
  retryCredits: number | null;
  onReuse: (item: LibraryItem) => void;
  onCopy: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
  onRetry: (item: LibraryItem) => void;
  /** Không có: mục không chọn được (đang tạo). */
  select?: Selection;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(menuOpen, menuRef, closeMenu);

  const kindText = item.kind === 'video' ? 'video' : 'ảnh';
  const summary = paramSummary(item.kind, item.modelName, item.params);
  const elapsed = now != null ? fmtElapsed(now - new Date(item.createdAt).getTime()) : '';

  if (item.status === 'pending' || item.status === 'processing') {
    const rendering = item.status === 'processing';
    return (
      <div className="card unselectable">
        <div className="frame status" style={rendering ? undefined : { gap: 4 }}>
          {rendering ? (
            <>
              <span className="accent" style={{ fontSize: 13, fontWeight: 600 }}>
                Đang render{elapsed && ` · ${elapsed}`}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                Bạn có thể rời trang. Kết quả sẽ hiện trong thư viện khi xong.
              </span>
              <div className="progress-track">
                <div />
              </div>
            </>
          ) : (
            <>
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
                Đang chờ xử lý
              </span>
              <span className="mono faint" style={{ fontSize: 12 }}>
                {elapsed}
              </span>
            </>
          )}
        </div>
        <div className="card-body">
          <p className="card-title">{item.prompt}</p>
          {rendering ? (
            <p className="card-meta meta-row">
              <span>{summary}</span>
              <CreditUsed value={item.credits} title="Credit đã dùng" />
            </p>
          ) : (
            <p className="card-meta">{summary}</p>
          )}
        </div>
      </div>
    );
  }

  const selecting = Boolean(select?.active);
  const cardClass = `card${select?.selected ? ' selected' : ''}`;
  // Đang chọn nhiều: bấm vào thẻ là chọn/bỏ chọn, không mở trang chi tiết.
  const toggleOnClick = select?.active ? (e: MouseEvent) => select.onToggle(item, e.shiftKey) : undefined;

  if (item.status === 'error') {
    return (
      <div className={cardClass} onClick={toggleOnClick}>
        {select && <SelectBox item={item} select={select} />}
        <div className="frame status failed">
          <span className="danger-text" style={{ display: 'flex' }}>
            <Icon name="alert" size={24} />
          </span>
          <span className="danger-text" style={{ fontSize: 14, fontWeight: 600 }}>
            Không tạo được {kindText}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>
            Hệ thống không xử lý được yêu cầu này. Bạn có thể thử lại, hoặc sửa prompt rồi tạo mới.
          </span>
          {item.refundedCredits > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Icon name="check" size={14} className="accent" />
              Đã hoàn {fmtNumber(item.refundedCredits)} credit
            </span>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4, visibility: selecting ? 'hidden' : undefined }}>
            {retryCredits != null && (
              <button
                type="button"
                onClick={() => onRetry(item)}
                style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #3A3A34', background: '#23231F', fontSize: 13, fontWeight: 500 }}
              >
                Thử lại <span className="mono muted">· {fmtNumber(retryCredits)}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onReuse(item)}
              style={{ height: 40, padding: '0 12px', borderRadius: 10, border: 0, background: 'transparent', fontSize: 13, fontWeight: 500 }}
            >
              Dùng lại prompt
            </button>
          </div>
        </div>
        <div className="card-body">
          <p className="card-title">{item.prompt}</p>
          <p className="card-meta">{summary}</p>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="overlay-btn"
            aria-label="Chuyển vào thùng rác"
            title="Chuyển vào thùng rác"
            onClick={() => onDelete(item)}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      </div>
    );
  }

  const multi = item.kind === 'image' && item.versionCount > 1;
  const durationSec = Number(item.params.duration);
  return (
    <div className={cardClass}>
      {select && <SelectBox item={item} select={select} />}
      <Link
        href={detailHref(item)}
        onClick={(e) => {
          if (!toggleOnClick) return;
          e.preventDefault();
          toggleOnClick(e);
        }}
      >
        <div className="frame">
          <Media item={item} />
          {multi && (
            <span className="ver-badge" title={`${item.versionCount} phiên bản`}>
              <Icon name="layers" size={14} />
              {item.versionCount}
              <span className="sr-only"> phiên bản</span>
            </span>
          )}
          <span className="media-label">
            {item.kind === 'video' ? 'Video' : 'Ảnh'}
            {item.params.ratio ? ` · ${ratioLabel(item.params.ratio)}` : ''}
          </span>
          {item.kind === 'video' && Number.isFinite(durationSec) && durationSec > 0 && (
            <span className="media-label right">{fmtClock(durationSec)}</span>
          )}
        </div>
        <div className="card-body">
          <p className="card-title">{item.prompt}</p>
          <p className="card-meta meta-row">
            <span>{multi ? `${item.modelName} · ${item.versionCount} phiên bản` : summary}</span>
            <CreditUsed
              value={item.kind === 'image' ? item.totalCredits : item.credits - item.refundedCredits}
              title={multi ? `Tổng credit đã dùng cho ${item.versionCount} phiên bản` : 'Credit đã dùng'}
            />
          </p>
        </div>
      </Link>
      <div className={`card-actions${menuOpen ? ' open' : ''}`} ref={menuRef}>
        <a
          className="overlay-btn"
          href={`/api/generations/${item.kind === 'image' ? item.displayId ?? item.id : item.id}/download`}
          aria-label="Tải về"
          title="Tải về"
        >
          <Icon name="download" size={18} />
        </a>
        <button type="button" className="overlay-btn" aria-label="Dùng lại prompt" title="Dùng lại prompt" onClick={() => onReuse(item)}>
          <Icon name="pencil" size={18} />
        </button>
        <button
          type="button"
          className="overlay-btn"
          aria-label="Thêm thao tác"
          title="Thêm thao tác"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon name="more" size={18} />
        </button>
        {menuOpen && (
          <div className="menu" style={{ top: 48, right: 0, width: 210 }}>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onCopy(item);
              }}
            >
              <Icon name="copy" />
              Sao chép prompt
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                closeMenu();
                onDelete(item);
              }}
            >
              <Icon name="trash" />
              Chuyển vào thùng rác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Một mục trong Thùng rác: xem trước, số ngày còn lại, Khôi phục hoặc Xoá vĩnh viễn (có bước xác nhận). */
export function TrashCard({
  item,
  now,
  onRestore,
  onPurge,
  select,
}: {
  item: LibraryItem;
  now: number | null;
  onRestore: (item: LibraryItem) => Promise<void>;
  onPurge: (item: LibraryItem) => Promise<void>;
  select: Selection;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = item.status === 'pending' || item.status === 'processing';
  const daysLeft = now != null && item.deletedAt ? trashDaysLeft(item.deletedAt, now) : null;
  const run = async (fn: (item: LibraryItem) => Promise<void>) => {
    setBusy(true);
    try {
      await fn(item);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };
  return (
    <div
      className={`card trash-card${select.selected ? ' selected' : ''}`}
      onClick={select.active ? (e) => select.onToggle(item, e.shiftKey) : undefined}
    >
      <SelectBox item={item} select={select} />
      {item.status === 'success' ? (
        <div className="frame">
          <Media item={item} />
          {item.kind === 'image' && item.versionCount > 1 && (
            <span className="ver-badge" title={`${item.versionCount} phiên bản`}>
              <Icon name="layers" size={14} />
              {item.versionCount}
              <span className="sr-only"> phiên bản</span>
            </span>
          )}
          <span className="media-label">
            {item.kind === 'video' ? 'Video' : 'Ảnh'}
            {item.params.ratio ? ` · ${ratioLabel(item.params.ratio)}` : ''}
          </span>
        </div>
      ) : (
        <div className="frame status">
          <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
            {running ? 'Đang tạo dở' : `Không tạo được ${item.kind === 'video' ? 'video' : 'ảnh'}`}
          </span>
        </div>
      )}
      <div className="card-body">
        <p className="card-title">{item.prompt}</p>
        <p className="trash-left">
          {daysLeft == null ? '\u00a0' : daysLeft === 0 ? 'Tự xoá vĩnh viễn hôm nay' : `Tự xoá vĩnh viễn sau ${daysLeft} ngày`}
        </p>
        <div className="trash-actions" style={select.active ? { visibility: 'hidden' } : undefined}>
          {confirming ? (
            <>
              <span className="danger-text" style={{ fontSize: 13, fontWeight: 500, marginRight: 'auto' }}>
                Xoá vĩnh viễn?
              </span>
              <button type="button" className="mini-btn danger-fill" disabled={busy} onClick={() => run(onPurge)}>
                Xoá
              </button>
              <button type="button" className="mini-btn" disabled={busy} onClick={() => setConfirming(false)}>
                Huỷ
              </button>
            </>
          ) : (
            <>
              <button type="button" className="mini-btn" disabled={busy} onClick={() => run(onRestore)}>
                <Icon name="undo" size={14} />
                Khôi phục
              </button>
              <button
                type="button"
                className="mini-btn danger-ghost"
                disabled={busy || running}
                title={running ? 'Đợi tạo xong rồi hãy xoá vĩnh viễn' : undefined}
                onClick={() => setConfirming(true)}
              >
                <Icon name="trash" size={14} />
                Xoá vĩnh viễn
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
