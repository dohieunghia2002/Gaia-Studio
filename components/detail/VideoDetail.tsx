'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Icon } from '../Icon';
import { useCredit } from '../CreditContext';
import { useToasts } from '../Toasts';
import { CopyPromptButton, isRunning, MoreMenu, StatusBlock, useNow, useSyncRunning } from './shared';
import { api, ClientError } from '@/lib/client/api';
import { formatOptionValue, optionLabel, ratioLabel, ratioNumber } from '@/lib/catalog';
import { clampText, fmtClockPadded, fmtDayMonthTime, fmtNumber } from '@/lib/format';
import type { CatalogModel, GenerationItem } from '@/lib/types';

function Player({ item }: { item: GenerationItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(Number(item.params.duration) || 0);
  const ratio = ratioNumber(item.params.ratio);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <>
      <div className="player-frame" ref={frameRef} style={{ aspectRatio: String(ratio) }}>
        <video
          ref={videoRef}
          src={item.url ?? undefined}
          poster={item.thumbUrl ?? undefined}
          playsInline
          preload="metadata"
          muted={muted}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || duration)}
        />
        {!playing && (
          <button type="button" className="player-big" aria-label="Phát video" onClick={toggle}>
            <Icon name="play" size={26} />
          </button>
        )}
        <span className="media-label" style={{ left: 12, top: 12, bottom: 'auto', padding: '3px 8px' }}>
          VIDEO{item.params.ratio ? ` · ${ratioLabel(item.params.ratio)}` : ''}
        </span>
      </div>
      <div className="player-bar">
        <button type="button" className="player-play" aria-label={playing ? 'Tạm dừng' : 'Phát video'} onClick={toggle}>
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
        <span className="mono muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {fmtClockPadded(time)} / {fmtClockPadded(duration)}
        </span>
        <label htmlFor="gaia-seek" className="sr-only">
          Tua video
        </label>
        <input
          id="gaia-seek"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => {
            const v = videoRef.current;
            if (v) v.currentTime = Number(e.target.value);
            setTime(Number(e.target.value));
          }}
        />
        <button type="button" className="ctl" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={() => setMuted((m) => !m)}>
          <Icon name={muted ? 'mute' : 'volume'} size={18} />
        </button>
        <button
          type="button"
          className="ctl"
          aria-label="Toàn màn hình"
          onClick={() => {
            const el = frameRef.current;
            if (!el) return;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else el.requestFullscreen?.().catch(() => {});
          }}
        >
          <Icon name="max" size={18} />
        </button>
      </div>
    </>
  );
}

export function VideoDetail({
  initialItem,
  model,
  rerunCredits,
}: {
  initialItem: GenerationItem;
  model?: CatalogModel;
  rerunCredits: number | null;
}) {
  const router = useRouter();
  const { push } = useToasts();
  const { balance, setBalance, canTopup } = useCredit();
  const [item, setItem] = useState(initialItem);
  const [busy, setBusy] = useState(false);
  const running = isRunning(item.status);
  const now = useNow(running);

  useSyncRunning(running, (items, bal) => {
    setBalance(bal);
    const fresh = items.find((i) => i.id === item.id);
    if (fresh) setItem(fresh);
    else
      api<{ root: GenerationItem }>(`/api/generations/${item.id}`)
        .then((d) => setItem(d.root))
        .catch(() => {});
  });

  const lacking = rerunCredits != null && rerunCredits > balance;

  const rerun = async () => {
    if (rerunCredits == null || busy) return;
    setBusy(true);
    try {
      const res = await api<{ items: GenerationItem[]; balance: number }>(`/api/generations/${item.id}/rerun`, {
        method: 'POST',
        json: { expectedCredits: rerunCredits },
      });
      setBalance(res.balance);
      router.push('/studio');
    } catch (err) {
      if (err instanceof ClientError && err.code === 'insufficient_credits') {
        push({ kind: 'error', title: err.message, action: canTopup ? { label: 'Nạp credit', href: '/credit' } : undefined });
      } else push({ kind: 'error', title: err instanceof Error ? err.message : 'Có lỗi xảy ra' });
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/api/generations/${item.id}`, { method: 'DELETE' });
      router.push('/studio');
    } catch (err) {
      push({ kind: 'error', title: err instanceof Error ? err.message : 'Không xoá được' });
    }
  };

  const p = item.params;
  const frames = [
    item.inputs?.start && { label: 'Start frame', url: item.inputs.start.url },
    item.inputs?.end && { label: 'End frame', url: item.inputs.end.url },
  ].filter((f): f is { label: string; url: string } => Boolean(f));

  return (
    <div className="page">
      <header className="detail-top">
        <div className="left">
          <Link href="/studio" className="back">
            <Icon name="arrow-left" size={18} />
            Studio
          </Link>
          <h1 className="detail-title">{clampText(item.prompt, 80)}</h1>
        </div>
        <div className="actions">
          {rerunCredits != null && (
            <button type="button" className="btn" disabled={busy || lacking} onClick={rerun} title={lacking ? 'Không đủ credit' : undefined}>
              {busy ? <span className="spinner" /> : <Icon name="refresh" />}
              Tạo lại <span className="c">· {fmtNumber(rerunCredits)} credit</span>
            </button>
          )}
          {item.status === 'success' ? (
            <a className="btn" href={`/api/generations/${item.id}/download`}>
              <Icon name="download" />
              Tải về
            </a>
          ) : (
            <button type="button" className="btn" disabled>
              <Icon name="download" />
              Tải về
            </button>
          )}
          <Link href={`/studio?reuse=${item.id}`} className="btn">
            <Icon name="pencil" />
            Dùng lại prompt
          </Link>
          <MoreMenu>
            {(close) => (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  close();
                  remove();
                }}
              >
                <Icon name="trash" />
                Chuyển vào thùng rác
              </button>
            )}
          </MoreMenu>
        </div>
      </header>

      <div className="split">
        <div className="stage" style={{ justifyContent: 'center', gap: 14, padding: 32 }}>
          {item.status === 'success' && item.url ? (
            <Player item={item} />
          ) : (
            <div className="player-frame" style={{ aspectRatio: String(ratioNumber(p.ratio)) }}>
              <StatusBlock item={item} now={now} what="video" />
            </div>
          )}
        </div>

        <aside className="side">
          <section>
            <h2>Thông tin</h2>
            <dl className="info">
              <div>
                <dt>Model</dt>
                <dd>{item.modelName}</dd>
              </div>
              {p.mode && (
                <div>
                  <dt>Mode</dt>
                  <dd>{optionLabel(model, 'mode', p.mode)}</dd>
                </div>
              )}
              <div>
                <dt>Ratio</dt>
                <dd className="mono">{ratioLabel(p.ratio) || '—'}</dd>
              </div>
              {p.resolution && (
                <div>
                  <dt>Resolution</dt>
                  <dd className="mono">{formatOptionValue('resolution', p.resolution)}</dd>
                </div>
              )}
              {p.duration && (
                <div>
                  <dt>Duration</dt>
                  <dd className="mono">{p.duration}s</dd>
                </div>
              )}
              <div>
                <dt>Credit</dt>
                <dd className="mono">{fmtNumber(item.credits - item.refundedCredits)}</dd>
              </div>
              <div>
                <dt>Tạo lúc</dt>
                <dd className="mono">{fmtDayMonthTime(item.createdAt)}</dd>
              </div>
            </dl>
          </section>
          <section className="prompt-box">
            <div className="head">
              <span>Prompt</span>
              <CopyPromptButton text={item.prompt} />
            </div>
            <p>{item.prompt}</p>
          </section>
          {frames.length > 0 && (
            <section>
              <h2>Input frames</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {frames.map((f) => (
                  <figure key={f.label} style={{ margin: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.url}
                      alt={f.label}
                      style={{ width: '100%', aspectRatio: String(ratioNumber(p.ratio)), objectFit: 'cover', borderRadius: 10, background: '#2A2A26' }}
                    />
                    <figcaption className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {f.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
