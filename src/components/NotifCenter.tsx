"use client";
import { useEffect, useRef, useState } from "react";
import { ago, bucket, kindOf, stamp, tintOf, type Notif } from "@/lib/notifs";
import { beacon } from "@/lib/beacon";
import type { Settings } from "@/lib/theme";
import NotifBody, { Glyph, inline } from "./NotifBody";
import ZoomImg from "./Zoom";
import { useInbox } from "./useInbox";

type Inbox = ReturnType<typeof useInbox>;
type Toast = { msg: string; undo?: () => void } | null;

const Ic = ({ d, s = 18, w = 2 }: { d: string; s?: number; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: d }} />
);
const BACK = '<path d="m15 18-6-6 6-6"/>';
const CHECKS = '<path d="m2.5 12.5 4.5 4.5L15 8.5M10 16.5l1 1L21.5 7.5"/>';
const TRASH = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>';
const SHARE = '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"/>';
const PIN = '<path d="M9 4h6l-1 6 3 3v2H7v-2l3-3zM12 15v6"/>';
const DOT = '<circle cx="12" cy="12" r="5" fill="currentColor"/>';
const EMPTY = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>';

const ORDER = ["Pinned", "Today", "Yesterday", "This week", "Earlier"];

// The notifications page. Used full-screen on /notifications and inside the dashboard's phone preview.
export function NotifCenter({ t, inbox, embedded, onBack }: { t: Settings; inbox: Inbox; embedded?: boolean; onBack?: () => void }) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [toast, setToast] = useState<Toast>(null);
  const [sure, setSure] = useState(false);
  const pushed = useRef(false);
  const tt = useRef<ReturnType<typeof setTimeout>>(undefined);
  const st = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A notification can be opened straight from a link: /notifications#its-id
  useEffect(() => {
    if (embedded) return;
    const sync = () => { try { setOpenKey(decodeURIComponent(location.hash.slice(1)) || null); } catch { setOpenKey(null); } };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [embedded]);
  useEffect(() => () => { clearTimeout(tt.current); clearTimeout(st.current); }, []);

  const go = (k: string | null) => {
    if (embedded) { setOpenKey(k); return; }
    if (k) { pushed.current = true; location.hash = k; }
    else if (pushed.current) { pushed.current = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search); setOpenKey(null); }
    window.scrollTo?.({ top: 0 });
  };
  const say = (msg: string, undo?: () => void) => { setToast({ msg, undo }); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(null), undo ? 6000 : 2400); };

  const cur = openKey ? inbox.items.find((n) => n.key === openKey) : undefined;
  // Opening something unread marks it read, and counts one "opened" for your stats.
  useEffect(() => {
    if (!cur || !inbox.ready || !inbox.isUnread(cur)) return;
    inbox.markRead(cur);
    if (!embedded) beacon("nview", cur.key, cur.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.key, inbox.ready]);

  const del = (n: Notif) => {
    inbox.remove(n);
    say("Notification deleted", () => inbox.restore(n));
    if (openKey === n.key) go(null);
  };
  const clearAll = () => {
    if (!sure) { setSure(true); clearTimeout(st.current); st.current = setTimeout(() => setSure(false), 3000); return; }
    const was = inbox.visible;
    inbox.clear(); setSure(false);
    say(`Cleared ${was.length} notification${was.length === 1 ? "" : "s"}`, () => inbox.restoreMany(was));
  };
  const share = async (n: Notif) => {
    const url = `${location.origin}/notifications#${n.key}`;
    if (typeof navigator !== "undefined" && "share" in navigator) { try { await navigator.share({ title: n.title, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); say("Link copied"); } catch { say("Could not copy the link"); }
  };

  const list = tab === "unread" ? inbox.visible.filter(inbox.isUnread) : inbox.visible;
  const groups = ORDER.map((g) => [g, list.filter((n) => bucket(n, now) === g)] as const).filter(([, a]) => a.length);
  let idx = 0;

  const back = openKey
    ? <button type="button" className="nc-ib" onClick={() => go(null)} aria-label="Back to the list"><Ic d={BACK} s={20} /></button>
    : embedded ? <button type="button" className="nc-ib" onClick={onBack} aria-label="Back to the page"><Ic d={BACK} s={20} /></button>
    : <a className="nc-ib" href="/" aria-label="Back to the page"><Ic d={BACK} s={20} /></a>;

  return (
    <div className="nc">
      <header className="nc-top surf">
        {back}
        <h1 className="nc-h">{t.bellLabel}{inbox.badge > 0 && !openKey && <span className="nc-cnt">{inbox.badge} new</span>}</h1>
        {!openKey && (
          <div className="nc-tools">
            <button type="button" className="nc-ib" onClick={() => { inbox.markAll(); say("All marked as read"); }} disabled={!inbox.unread} aria-label="Mark all as read" title="Mark all as read"><Ic d={CHECKS} /></button>
            <button type="button" className={`nc-ib${sure ? " sure" : ""}`} onClick={clearAll} disabled={!inbox.visible.length} aria-label={sure ? "Tap again to clear all" : "Clear all"} title={sure ? "Tap again to clear all" : "Clear all"}>{sure ? <b>Sure?</b> : <Ic d={TRASH} />}</button>
          </div>
        )}
      </header>

      {openKey ? (
        cur ? (
          <article className="nc-detail surf" style={{ "--k": tintOf(cur) } as React.CSSProperties}
            onClick={(e) => { if (embedded) return; const a = (e.target as Element).closest<HTMLElement>("[data-nl]"); if (a) beacon("nclick", cur.key, cur.title); }}>
            {cur.image && <div className="nc-cover"><ZoomImg src={cur.image} /></div>}
            <div className="nc-dm">
              <span className="nc-kd"><Glyph k={cur.kind} s={14} />{kindOf(cur.kind).name}</span>
              {cur.pinned && <span className="nc-pn"><Ic d={PIN} s={13} />Pinned</span>}
              <time suppressHydrationWarning>{ago(stamp(cur), now)}</time>
            </div>
            <h2 className="nc-dt">{cur.title}</h2>
            {cur.summary && <p className="nc-ds">{inline(cur.summary, cur.key)}</p>}
            <NotifBody blocks={cur.blocks} nk={cur.key} title={cur.title} preview={embedded} />
            {cur.cta && cur.ctaUrl && <a className="nf-btn solid" href={cur.ctaUrl} data-nl={cur.key} {...(/^https?:/i.test(cur.ctaUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{cur.cta}</a>}
            <div className="nc-da">
              <button type="button" className="nc-bt" onClick={() => { inbox.markUnread(cur); say("Marked as unread"); }}><Ic d={DOT} s={16} />Mark as unread</button>
              {!embedded && <button type="button" className="nc-bt" onClick={() => share(cur)}><Ic d={SHARE} s={16} />Share</button>}
              <button type="button" className="nc-bt dn" onClick={() => del(cur)}><Ic d={TRASH} s={16} />Delete</button>
            </div>
          </article>
        ) : (
          <div className="nc-empty surf"><Ic d={EMPTY} s={34} w={1.6} /><b>That notification is no longer available</b><span>It may have ended or been removed.</span><button type="button" className="nc-bt" onClick={() => go(null)}>See all notifications</button></div>
        )
      ) : (
        <>
          <div className="nc-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "all"} className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All<i>{inbox.visible.length}</i></button>
            <button type="button" role="tab" aria-selected={tab === "unread"} className={tab === "unread" ? "on" : ""} onClick={() => setTab("unread")}>Unread<i>{inbox.unread}</i></button>
          </div>

          {groups.map(([g, arr]) => (
            <section key={g} className="nc-g">
              <h2 className="nc-gh">{g === "Pinned" ? <><Ic d={PIN} s={13} />Pinned</> : g}</h2>
              {arr.map((n) => {
                const un = inbox.isUnread(n);
                const i = idx++;
                return (
                  <article key={n.key} className={`card surf nc-item${un ? " un" : ""}`} style={{ "--i": i, "--k": tintOf(n) } as React.CSSProperties}>
                    <button type="button" className="nc-main" onClick={() => go(n.key)}>
                      <span className={`nc-ic${n.image ? " ph" : ""}`}>{n.image ? <img src={n.image} alt="" loading="lazy" /> : <Glyph k={n.kind} s={22} />}</span>
                      <span className="nc-tx">
                        <span className="nc-meta"><i className="nc-kd">{kindOf(n.kind).name}</i><time suppressHydrationWarning>{ago(stamp(n), now)}</time>{n.pinned && <Ic d={PIN} s={12} />}</span>
                        <b className="nc-tt">{n.title}</b>
                        {n.summary && <span className="nc-sm">{n.summary}</span>}
                      </span>
                      {un && <i className="nc-dot" role="img" aria-label="Unread" />}
                    </button>
                    <div className="nc-ac">
                      <button type="button" className="nc-bt" onClick={() => (un ? inbox.markRead(n) : inbox.markUnread(n))}>{un ? <><Ic d={CHECKS} s={15} />Mark as read</> : <><Ic d={DOT} s={15} />Mark as unread</>}</button>
                      <button type="button" className="nc-bt dn" onClick={() => del(n)}><Ic d={TRASH} s={15} />Delete</button>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}

          {!list.length && (
            <div className="nc-empty surf">
              <Ic d={EMPTY} s={34} w={1.6} />
              {!inbox.items.length ? <><b>No notifications yet</b><span>When something new is posted, it shows up here.</span></>
                : inbox.visible.length ? <><b>You are all caught up</b><span>Nothing unread right now.</span></>
                : <><b>All cleared</b><span>{inbox.deleted} deleted notification{inbox.deleted === 1 ? "" : "s"} can be brought back.</span></>}
              {inbox.deleted > 0 && <button type="button" className="nc-bt" onClick={() => { inbox.restoreAll(); setTab("all"); }}>Show {inbox.deleted} deleted</button>}
            </div>
          )}
          {list.length > 0 && inbox.deleted > 0 && <button type="button" className="nc-more" onClick={() => inbox.restoreAll()}>Show {inbox.deleted} deleted</button>}
        </>
      )}

      {toast && (
        <div className="nc-toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && <button type="button" onClick={() => { toast.undo?.(); setToast(null); }}>Undo</button>}
        </div>
      )}
    </div>
  );
}

// The page at /notifications.
export default function NotifPage({ t, initial }: { t: Settings; initial: Notif[] }) {
  const inbox = useInbox(initial, { live: true });
  return <NotifCenter t={t} inbox={inbox} />;
}
