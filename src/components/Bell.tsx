"use client";
import { useState } from "react";
import type { Notif } from "@/lib/notifs";
import type { Settings } from "@/lib/theme";
import { NotifCenter } from "./NotifCenter";
import { useInbox, useRing } from "./useInbox";

// The button itself. Shared by the real bell and by the dashboard previews (inline).
export function BellBtn({ t, count, ringing, href, onClick, inline }: { t: Settings; count: number; ringing: boolean; href?: string; onClick?: () => void; inline?: boolean }) {
  const label = `${t.bellLabel}${count ? `, ${count} unread` : ""}`;
  const cls = `bl bl-${t.bellStyle}${t.bellStyle === "surface" ? " surf" : ""}${ringing ? " ring" : ""}${inline ? " in" : ""}`;
  const body = (
    <>
      <span className="bl-r" aria-hidden />
      <svg className="bl-i" viewBox="0 0 24 24" fill="currentColor" fillOpacity={count ? 0.16 : 0} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path className="bl-c" fill="none" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && <span className={`bl-n${t.bellBadge === "dot" ? " dt" : ""}`} aria-hidden>{t.bellBadge === "dot" ? "" : count > 99 ? "99+" : count}</span>}
    </>
  );
  return href ? <a className={cls} href={href} aria-label={label} title={t.bellLabel}>{body}</a>
    : <button type="button" className={cls} aria-label={label} title={t.bellLabel} onClick={onClick}>{body}</button>;
}

// The floating bell on the page. It rings now and then while something is unread, and opens the notifications page.
export default function Bell({ t, initial, embedded }: { t: Settings; initial: Notif[]; embedded?: boolean }) {
  const inbox = useInbox(initial, { live: !embedded });
  const count = inbox.ready ? inbox.badge : 0;
  const ringing = useRing(inbox.ready && count > 0, t.bellMotion, t.bellEvery);
  const [open, setOpen] = useState(false);
  if (t.bellShow === "off") return null;
  if (t.bellShow === "auto" && !inbox.items.length) return null;
  return (
    <>
      <div className="bl-fx" data-bp={t.bellPos} data-bm={t.bellMotion}>
        <BellBtn t={t} count={count} ringing={ringing} {...(embedded ? { onClick: () => setOpen(true) } : { href: "/notifications" })} />
      </div>
      {embedded && open && <div className="nc-ov"><NotifCenter t={t} inbox={inbox} embedded onBack={() => setOpen(false)} /></div>}
    </>
  );
}

// A bell that keeps ringing, for the dashboard's bell settings.
export function BellDemo({ t, count = 3 }: { t: Settings; count?: number }) {
  const ringing = useRing(true, t.bellMotion, Math.min(t.bellEvery, 4));
  return <div className="bl-fx in" data-bm={t.bellMotion}><BellBtn t={t} count={count} ringing={ringing} inline onClick={() => {}} /></div>;
}
