"use client";
import { useEffect } from "react";

// Anonymous visit and click counting. Your own devices are filtered out on the server.
export default function Track() {
  useEffect(() => {
    if (/(^|; )ig=1/.test(document.cookie)) return;
    let v = "";
    try { v = localStorage.getItem("bv") || ""; if (!v) { v = crypto.randomUUID(); localStorage.setItem("bv", v); } } catch { v = "anon-" + Math.random().toString(36).slice(2, 12); }
    const send = (t: string, k?: string, title?: string) => {
      const body = JSON.stringify({ t, v, k, title, ref: t === "view" ? document.referrer : undefined, lang: navigator.language });
      try {
        if (!navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" })))
          fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
      } catch {}
    };
    send("view");
    const on = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-tk]");
      if (el) send(el.dataset.ta || "click", el.dataset.tk, el.dataset.tt);
    };
    document.addEventListener("click", on, true);
    return () => document.removeEventListener("click", on, true);
  }, []);
  return null;
}
