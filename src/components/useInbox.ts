"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { liveAt, readKey, sortN, type Notif } from "@/lib/notifs";

const RK = "bell-read", DK = "bell-gone", EV = "bell-sync";
const load = (k: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(-400) : []; } catch { return []; }
};

// What a visitor has read or deleted lives on their own device. The bell, the notifications page and the admin preview all use this.
// With live=false (admin preview) nothing is fetched or saved and the marks only last until the preview closes.
export function useInbox(initial: Notif[], { live }: { live: boolean }) {
  const [fresh, setFresh] = useState<Notif[] | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const [gone, setGone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const rr = useRef<string[]>([]), gg = useRef<string[]>([]);
  rr.current = read; gg.current = gone;

  useEffect(() => {
    if (!live) { setReady(true); return; }
    const pull = () => { setRead(load(RK)); setGone(load(DK)); };
    pull(); setReady(true);
    const onStore = (e: StorageEvent) => { if (e.key === RK || e.key === DK) pull(); };
    window.addEventListener(EV, pull);
    window.addEventListener("storage", onStore);
    return () => { window.removeEventListener(EV, pull); window.removeEventListener("storage", onStore); };
  }, [live]);

  // Fresh list from the server: on open and whenever the tab becomes visible again.
  useEffect(() => {
    if (!live) return;
    let on = true;
    const go = () => {
      fetch("/api/notifications", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (on && j && Array.isArray(j.items)) setFresh(j.items); }).catch(() => {});
    };
    go();
    const vis = () => { if (document.visibilityState === "visible") go(); };
    document.addEventListener("visibilitychange", vis);
    return () => { on = false; document.removeEventListener("visibilitychange", vis); };
  }, [live]);

  const save = useCallback((k: string, v: string[]) => {
    const next = v.slice(-400);
    if (k === RK) setRead(next); else setGone(next);
    if (!live) return;
    try { localStorage.setItem(k, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(EV));
  }, [live]);

  const items = useMemo(() => {
    const now = Date.now();
    return ((live && fresh) || initial).filter((n) => liveAt(n, now)).sort(sortN);
  }, [live, fresh, initial]);

  const rs = useMemo(() => new Set(read), [read]);
  const gs = useMemo(() => new Set(gone), [gone]);
  const visible = useMemo(() => items.filter((n) => !gs.has(readKey(n))), [items, gs]);
  const isUnread = useCallback((n: Notif) => !rs.has(readKey(n)), [rs]);
  const unread = visible.filter(isUnread).length;
  const badge = visible.filter((n) => isUnread(n) && !n.quiet).length; // quiet ones never ring the bell
  const deleted = items.length - visible.length;

  return {
    ready, items, visible, unread, badge, deleted, isUnread,
    markRead: (n: Notif) => { if (!rr.current.includes(readKey(n))) save(RK, [...rr.current, readKey(n)]); },
    markUnread: (n: Notif) => save(RK, rr.current.filter((k) => k !== readKey(n))),
    markAll: () => save(RK, [...new Set([...rr.current, ...visible.map(readKey)])]),
    remove: (n: Notif) => { if (!gg.current.includes(readKey(n))) save(DK, [...gg.current, readKey(n)]); },
    restore: (n: Notif) => save(DK, gg.current.filter((k) => k !== readKey(n))),
    restoreMany: (ns: Notif[]) => { const ks = new Set(ns.map(readKey)); save(DK, gg.current.filter((k) => !ks.has(k))); },
    restoreAll: () => save(DK, []),
    clear: () => save(DK, [...new Set([...gg.current, ...visible.map(readKey)])]),
  };
}

// Rings the bell for about a second, stays quiet for a while, then rings again. Only while something is waiting.
export function useRing(active: boolean, motion: string, every: number) {
  const [ringing, setRinging] = useState(false);
  useEffect(() => {
    if (!active || motion === "none" || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)) { setRinging(false); return; }
    let a: ReturnType<typeof setTimeout> | undefined, b: ReturnType<typeof setTimeout> | undefined;
    const cycle = () => { setRinging(true); a = setTimeout(() => { setRinging(false); b = setTimeout(cycle, every * 1000); }, 1300); };
    b = setTimeout(cycle, 900);
    return () => { clearTimeout(a); clearTimeout(b); setRinging(false); };
  }, [active, motion, every]);
  return ringing;
}
