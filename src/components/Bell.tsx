"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isLive, sortNotes, type Note } from "@/lib/notes";
import type { Settings } from "@/lib/theme";
import NoteView from "./NoteView";

type Store = { r: Record<string, number>; d: Record<string, number>; p: Record<string, number>; s: Record<string, number> };
const KEY = "bell:v1";
const lumOf = (h: string) => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export default function Bell({ notes, t, embedded }: { notes: Note[]; t: Settings; embedded?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  const [st, setSt] = useState<Store>({ r: {}, d: {}, p: {}, s: {} });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [ring, setRing] = useState(false);
  const [exp, setExp] = useState<Record<string, boolean>>({});
  const [undo, setUndo] = useState<string[] | null>(null);
  const undoT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const key = embedded ? KEY + ":preview" : KEY;

  useEffect(() => {
    setNow(Date.now()); setMounted(true);
    try { const v = JSON.parse(localStorage.getItem(key) || "{}"); setSt({ r: v.r || {}, d: v.d || {}, p: v.p || {}, s: v.s || {} }); } catch {}
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [key]);

  const save = useCallback((f: (s: Store) => Store) => setSt((cur) => { const n = f(cur); try { localStorage.setItem(key, JSON.stringify(n)); } catch {} return n; }), [key]);

  const live = useMemo(() => notes.filter((n) => isLive(n, now || Date.now())).sort(sortNotes), [notes, now]);
  const kept = live.filter((n) => !((st.d[n.key] ?? 0) >= n.rev));
  const isRead = (n: Note) => (st.r[n.key] ?? 0) >= n.rev;
  const unread = kept.filter((n) => !isRead(n));
  const shown = tab === "unread" ? unread : kept;

  // ring for about a second, rest, then again, only while something is unread
  useEffect(() => {
    if (!t.bellSwing || !unread.length || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)) { setRing(false); return; }
    let off: ReturnType<typeof setTimeout>;
    const go = () => { setRing(true); off = setTimeout(() => setRing(false), 1300); };
    const first = setTimeout(go, 900);
    const every = setInterval(go, Math.max(4, t.bellEvery) * 1000);
    return () => { clearTimeout(first); clearInterval(every); clearTimeout(off); };
  }, [t.bellSwing, t.bellEvery, unread.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // opening and closing, with the browser back button and #notifications links
  useEffect(() => {
    if (embedded) return;
    const sync = () => setOpen(location.hash === "#notifications" || location.hash.startsWith("#n-"));
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, [embedded]);
  const openPanel = () => { setOpen(true); if (!embedded && !location.hash.startsWith("#n-")) history.pushState({ bell: 1 }, "", "#notifications"); };
  const close = () => {
    if (!embedded && history.state?.bell) { history.back(); return; }
    setOpen(false);
    if (!embedded && location.hash) history.replaceState(null, "", location.pathname + location.search);
  };
  useEffect(() => {
    if (embedded) return;
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open, embedded]);
  useEffect(() => {
    if (!open || embedded || !location.hash.startsWith("#n-")) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
  }, [open, embedded, shown.length]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // a post that asks to pop up shows itself once to each visitor
  useEffect(() => {
    if (!mounted || embedded || open) return;
    const p = unread.find((n) => n.popup && (st.p[n.key] ?? 0) < n.rev);
    if (!p) return;
    const id = setTimeout(() => { save((s) => ({ ...s, p: { ...s.p, [p.key]: p.rev } })); openPanel(); }, 1100);
    return () => clearTimeout(id);
  }, [mounted, unread.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // count each post once per device when it is actually seen
  useEffect(() => {
    if (!open || embedded || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<string>();
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const el = e.target as HTMLElement;
      const k = el.id.slice(2);
      const n = shown.find((x) => x.key === k);
      if (!e.isIntersecting || !n || seen.has(k) || (st.s[k] ?? 0) >= n.rev) return;
      seen.add(k);
      save((s) => ({ ...s, s: { ...s.s, [k]: n.rev } }));
      if (/(^|; )ig=1/.test(document.cookie)) return;
      let v = "";
      try { v = localStorage.getItem("bv") || ""; if (!v) { v = crypto.randomUUID(); localStorage.setItem("bv", v); } } catch { return; }
      const body = JSON.stringify({ t: "note", v, k, title: n.title.slice(0, 60) || "Post" });
      try { navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" })); } catch {}
    }), { threshold: 0.55 });
    document.querySelectorAll<HTMLElement>(".np .nt").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [open, embedded, shown.map((n) => n.key).join(), tab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!t.bellOn || !mounted || (!live.length && !t.bellAlways)) return null;

  const mark = (n: Note, on: boolean) => save((s) => ({ ...s, r: { ...s.r, [n.key]: on ? Math.max(Date.now(), n.rev) : 0 } }));
  const markAll = () => save((s) => ({ ...s, r: { ...s.r, ...Object.fromEntries(kept.map((n) => [n.key, Math.max(Date.now(), n.rev)])) } }));
  const remove = (keys: string[]) => {
    save((s) => ({ ...s, d: { ...s.d, ...Object.fromEntries(keys.map((k) => [k, Math.max(Date.now(), live.find((n) => n.key === k)?.rev ?? 0)])) } }));
    setUndo(keys); clearTimeout(undoT.current); undoT.current = setTimeout(() => setUndo(null), 6000);
  };
  const restore = () => { if (!undo) return; save((s) => { const d = { ...s.d }; undo.forEach((k) => delete d[k]); return { ...s, d }; }); setUndo(null); };
  const copyLink = async (n: Note) => { try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#n-${n.key}`); setUndo(null); } catch {} };

  const bg = t.bellBg || t.accent;
  const low = (embedded ? 0 : 0) + (t.poweredShow && t.poweredPos === "fixed" && t.poweredSide === "bottom" ? 62 : 0);
  const style = {
    "--bsz": `${t.bellSize}px`, "--bb": t.bellBadgeColor, "--bo": `${low}px`,
    ...(t.bellColor ? { "--bc": t.bellColor } : {}),
    ...(t.bellStyle === "solid" ? { "--bbg": bg, "--bfg": t.bellColor || (lumOf(bg) > 0.62 ? "#111827" : "#ffffff") } : {}),
    ...(t.bellStyle === "outline" ? { "--bfg": t.bellColor || bg } : {}),
  } as React.CSSProperties;
  const count = unread.length;

  return (
    <>
      <button type="button" className={`bell ${t.bellStyle === "auto" ? "surf" : t.bellStyle} ${t.bellPos}${ring ? " ring" : ""}`} style={style} onClick={openPanel}
        aria-label={count ? `${t.bellTitle}, ${count} unread` : t.bellTitle}>
        <svg className="bi" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path className="bcl" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (t.bellBadge === "dot" ? <i className="bdg dot" /> : <i className="bdg">{count > 9 ? "9+" : count}</i>)}
      </button>

      {open && (
        <div className="np" role="dialog" aria-modal="true" aria-label={t.bellTitle} style={{ "--bb": t.bellBadgeColor } as React.CSSProperties}>
          <div className="np-in">
            <header className="np-top">
              <button type="button" className="np-back" onClick={close} aria-label="Back"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg></button>
              <h2>{t.bellTitle}</h2>
              {count > 0 && <span className="np-n">{count} new</span>}
            </header>
            {kept.length > 0 && (
              <div className="np-bar">
                <div className="np-tabs" role="tablist">
                  <button type="button" role="tab" aria-selected={tab === "all"} className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All<small>{kept.length}</small></button>
                  <button type="button" role="tab" aria-selected={tab === "unread"} className={tab === "unread" ? "on" : ""} onClick={() => setTab("unread")}>Unread<small>{count}</small></button>
                </div>
                <div className="np-acts">
                  {count > 0 && <button type="button" onClick={markAll}>Mark all read</button>}
                  <button type="button" onClick={() => remove(kept.map((n) => n.key))}>Clear all</button>
                </div>
              </div>
            )}
            <div className="np-list">
              {shown.map((n) => {
                const un = !isRead(n);
                const o = exp[n.key] ?? false;
                return (
                  <NoteView key={n.key} id={"n-" + n.key} n={n} unread={un} open={o} onToggle={() => { setExp((e) => ({ ...e, [n.key]: !o })); if (un) mark(n, true); }}>
                    <div className="nt-act">
                      <button type="button" onClick={() => mark(n, un)}>{un ? "Mark as read" : "Mark as unread"}</button>
                      <button type="button" onClick={() => copyLink(n)} aria-label="Copy link">Copy link</button>
                      <button type="button" className="del" onClick={() => remove([n.key])}>Delete</button>
                    </div>
                  </NoteView>
                );
              })}
              {!shown.length && (
                <div className="np-empty">
                  <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  <b>{tab === "unread" && kept.length ? "Nothing unread" : t.bellEmpty}</b>
                  {tab === "unread" && kept.length > 0 && <button type="button" onClick={() => setTab("all")}>Show all</button>}
                </div>
              )}
            </div>
          </div>
          {undo && <div className="np-toast" role="status"><span>{undo.length > 1 ? `${undo.length} cleared` : "Deleted"}</span><button type="button" onClick={restore}>Undo</button></div>}
        </div>
      )}
    </>
  );
}
