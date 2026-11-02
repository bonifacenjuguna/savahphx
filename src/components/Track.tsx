"use client";
import { useEffect } from "react";
import { beacon } from "@/lib/beacon";

// Anonymous visit and click counting. Your own devices are filtered out on the server.
export default function Track() {
  useEffect(() => {
    if (/(^|; )ig=1/.test(document.cookie)) return;
    beacon("view", undefined, undefined, document.referrer);
    const on = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-tk]");
      if (el) beacon(el.dataset.ta || "click", el.dataset.tk, el.dataset.tt);
    };
    document.addEventListener("click", on, true);
    return () => document.removeEventListener("click", on, true);
  }, []);
  return null;
}
