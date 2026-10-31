"use client";
import { useEffect, useRef, useState } from "react";

// A broken or missing brand logo never leaves an empty hole: it falls back to a plain link glyph.
const Glyph = ({ className }: { className?: string }) => (
  <svg className={`lgf ${className ?? ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

export function LogoImg({ src, className }: { src: string; className?: string }) {
  const [bad, setBad] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { setBad(false); const el = ref.current; if (el && el.complete && el.naturalWidth === 0) setBad(true); }, [src]);
  return bad ? <Glyph className={className} /> : <img ref={ref} className={className} src={src} alt="" onError={() => setBad(true)} />;
}

export function LogoMask({ url, color, className }: { url: string; color: string; className?: string }) {
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); const im = new Image(); im.onerror = () => setBad(true); im.src = url; }, [url]);
  return bad ? <Glyph className={className} />
    : <span className={`mk ${className ?? ""}`} style={{ "--m": `url(${url})`, background: color } as React.CSSProperties} />;
}
