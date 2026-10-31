"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Renders inside the nearest .pg so dialogs keep the page's colors, fonts and style.
export default function Modal({ anchor, onClose, className = "", children }: { anchor: React.RefObject<HTMLElement | null>; onClose: () => void; className?: string; children: React.ReactNode }) {
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    const el = anchor.current;
    setHost(el?.closest(".pg") ?? document.body);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    const lock = !el?.closest(".emb");
    if (lock) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); if (lock) document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return host ? createPortal(<div className={`mo ${className}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>{children}</div>, host) : null;
}
