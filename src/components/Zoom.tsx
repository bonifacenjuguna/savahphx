"use client";
import { useRef, useState } from "react";
import Modal from "./Modal";

// Photo or banner that opens full size when tapped.
export default function ZoomImg({ src, className = "", alt = "" }: { src: string; className?: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  return (
    <>
      <img ref={ref} className={`${className} zm`} src={src} alt={alt} role="button" tabIndex={0} onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }} />
      {open && (
        <Modal anchor={ref} onClose={() => setOpen(false)} className="lb">
          <img className="lbi" src={src} alt={alt} onClick={() => setOpen(false)} />
          <button type="button" className="mx lbx" aria-label="Close" onClick={() => setOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </Modal>
      )}
    </>
  );
}
