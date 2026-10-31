"use client";
import { useEffect, useRef, useState } from "react";

export default function CardMenu({ url, title, id }: { url: string; title: string; id: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const done = (m: string) => { setNote(m); setTimeout(() => { setNote(""); setOpen(false); }, 900); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url.replace(/^(mailto|tel):/, "")); done("Copied"); } catch { done("Could not copy"); }
  };
  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) { try { await navigator.share({ title, url }); } catch {} setOpen(false); }
    else copy();
  };
  const web = /^https?:/i.test(url);

  return (
    <div className="dm" ref={box}>
      <button type="button" className="dots" aria-label="More options" aria-haspopup="menu" aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
      </button>
      {open && (
        <div className="menu" role="menu">
          <a role="menuitem" href={url} data-tk={id} data-ta="click" data-tt={title} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Open link</a>
          <button type="button" role="menuitem" data-tk={id} data-ta="copylink" data-tt={title} onClick={copy}>{note || "Copy link"}</button>
          <button type="button" role="menuitem" data-tk={id} data-ta="share" data-tt={title} onClick={share}>Share</button>
        </div>
      )}
    </div>
  );
}
