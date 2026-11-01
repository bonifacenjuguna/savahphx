"use client";
import type { ReactNode } from "react";
import { renderMd } from "@/lib/md";
import { accentOf, ago, kindOf, type Note } from "@/lib/notes";
import ZoomImg from "./Zoom";

// One notification, drawn the same way for visitors and for the live preview in the dashboard.
const lumOf = (h: string) => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export default function NoteView({ n, unread, open = true, onToggle, children, id }: {
  n: Note; unread?: boolean; open?: boolean; onToggle?: () => void; children?: ReactNode; id?: string;
}) {
  const k = kindOf(n.kind);
  const long = n.body.length > 260 || n.body.split("\n").length > 7;
  const clamp = !open && long;
  const [first, ...rest] = n.images;
  return (
    <article id={id} className={`nt surf${unread ? " unread" : ""}`} style={{ "--na": accentOf(n), "--nf": lumOf(accentOf(n)) > 0.62 ? "#111827" : "#ffffff" } as React.CSSProperties}>
      <div className="nt-h">
        <span className="nt-k"><i aria-hidden>{n.emoji || k.emoji}</i>{k.name}</span>
        {n.pinned && <span className="nt-pin"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden><path d="M16 3a1 1 0 0 1 .7 1.7L15.4 6l2.8 2.8 1.3-1.3A1 1 0 0 1 21 9l-4 4v3l-1 1-3-3-5.6 5.6-1.4-1.4L11 12 8 9l1-1h3l4-4a1 1 0 0 1 0 0z" /></svg>Pinned</span>}
        <time>{ago(n.publishAt ?? n.createdAt)}</time>
        {unread && <b className="nt-dot" aria-label="Unread" />}
      </div>
      {n.title && <h3 className="nt-t" onClick={onToggle}>{n.title}</h3>}
      {first && (
        <div className={`nt-im${rest.length ? " multi" : ""}`}>
          <ZoomImg className="hero" src={first} />
          {rest.length > 0 && <div className={`rest c${Math.min(rest.length, 3)}`}>{rest.slice(0, 5).map((s) => <ZoomImg key={s} src={s} />)}</div>}
        </div>
      )}
      {n.body.trim() && <div className={`nt-b${clamp ? " fold" : ""}`} onClick={onToggle}>{renderMd(n.body)}</div>}
      {long && onToggle && <button type="button" className="nt-more" onClick={onToggle}>{open ? "Show less" : "Read more"}</button>}
      {n.ctaLabel && n.ctaUrl && (
        <a className="nt-cta" href={n.ctaUrl} target={/^https?:/i.test(n.ctaUrl) ? "_blank" : undefined} rel="noopener noreferrer" data-tk={n.key || undefined} data-ta="noteclick" data-tt={n.title.slice(0, 60) || n.ctaLabel}>
          {n.ctaLabel}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      )}
      {children}
    </article>
  );
}
