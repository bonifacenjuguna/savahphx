"use client";
import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export const httpsErr = (v: string) => (v && !/^https:\/\//i.test(v) ? "Must start with https://" : undefined);

const GL: Record<string, string> = {
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  header: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  style: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  icons: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  motion: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  footer: '<rect x="3" y="14" width="18" height="6" rx="3"/><path d="M3 5h18M3 9h10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  grip: '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
};
export const Gl = ({ n, s = 20 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: GL[n] }} />
);

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly (T | { v: T; l: string })[] }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.v, l = typeof o === "string" ? o : o.l;
        return <button type="button" key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l || "Default"}</button>;
      })}
    </div>
  );
}
export const Tgl = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={"tg" + (on ? " on" : "")} onClick={() => onChange(!on)}><b /></button>
);
export const Switch = ({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) => (
  <div className="swr"><span><i>{label}</i>{hint && <small>{hint}</small>}</span><Tgl on={on} onChange={onChange} label={label} /></div>
);
export const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div className={"f" + (error ? " bad" : "")}><span className="fl">{label}</span>{children}{error ? <em className="fe">{error}</em> : hint ? <small className="fh">{hint}</small> : null}</div>
);
export const Range = ({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
  <div className="f"><span className="fl">{label}<b>{value}{unit}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} /></div>
);

const hex2hsl = (h: string): [number, number, number] => {
  const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let hh = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
  return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
};
const hsl2hex = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
};
const SWATCHES = ["#ffffff", "#f5f7ff", "#d1d5db", "#9ca3af", "#4b5563", "#1f2937", "#0b0d12", "#000000", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#38bdf8", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"];

function ColorModal({ label, value, onChange, onClose }: { label: string; value: string; onChange: (v: string) => void; onClose: () => void }) {
  const [[h, s, l], setHsl] = useState(() => hex2hsl(value));
  const [txt, setTxt] = useState(value);
  const apply = (n: [number, number, number]) => { setHsl(n); const x = hsl2hex(...n); setTxt(x); onChange(x); };
  const pick = (x: string) => { setHsl(hex2hsl(x)); setTxt(x); onChange(x); };
  return (
    <div className="ov c" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cm" role="dialog" aria-label={label}>
        <div className="cmh"><b>{label}</b><button type="button" className="ib" onClick={onClose} aria-label="Close"><Gl n="x" /></button></div>
        <div className="prev" style={{ background: value }} />
        <div className="f"><span className="fl">Hue</span><input type="range" className="cr" min={0} max={360} value={h} onChange={(e) => apply([+e.target.value, s, l])} style={{ background: "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }} /></div>
        <div className="f"><span className="fl">Saturation</span><input type="range" className="cr" min={0} max={100} value={s} onChange={(e) => apply([h, +e.target.value, l])} style={{ background: `linear-gradient(90deg,${hsl2hex(h, 0, l)},${hsl2hex(h, 100, l)})` }} /></div>
        <div className="f"><span className="fl">Lightness</span><input type="range" className="cr" min={0} max={100} value={l} onChange={(e) => apply([h, s, +e.target.value])} style={{ background: `linear-gradient(90deg,#000,${hsl2hex(h, s, 50)},#fff)` }} /></div>
        <div className="sws">{SWATCHES.map((c) => <button type="button" key={c} aria-label={c} className={value.toLowerCase() === c ? "on" : ""} style={{ background: c }} onClick={() => pick(c)} />)}</div>
        <div className="f"><span className="fl">Hex</span>
          <input className="in" value={txt} maxLength={7} autoCapitalize="none" spellCheck={false}
            onChange={(e) => { const v = e.target.value; setTxt(v); if (/^#[0-9a-f]{6}$/i.test(v)) { setHsl(hex2hsl(v)); onChange(v.toLowerCase()); } }} />
        </div>
        <button type="button" className="btn pri" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
export function Color({ label, value, onChange, bare }: { label: string; value: string; onChange: (v: string) => void; bare?: boolean }) {
  const [o, setO] = useState(false);
  const btn = <button type="button" className="cw" onClick={() => setO(true)}><span className="cs" style={{ background: value }} /><code>{value}</code></button>;
  const modal = o && <ColorModal label={label} value={value} onChange={onChange} onClose={() => setO(false)} />;
  return bare ? <>{btn}{modal}</> : <div className="f"><span className="fl">{label}</span>{btn}{modal}</div>;
}
// A color that can follow the theme ("Auto") or be set by hand.
export function OptColor({ label, value, auto, onChange }: { label: string; value: string; auto: string; onChange: (v: string) => void }) {
  return (
    <div className="f"><span className="fl">{label}</span>
      <div className="oc">
        <Seg value={value ? "custom" : "auto"} onChange={(v) => onChange(v === "auto" ? "" : value || auto)} options={[{ v: "auto", l: "Auto" }, { v: "custom", l: "Custom" }]} />
        {value && <Color label={label} value={value} onChange={onChange} bare />}
      </div>
    </div>
  );
}

async function optimize(f: File): Promise<File> {
  if (f.type === "image/gif" || f.size < 300_000) return f;
  const bmp = await createImageBitmap(f).catch(() => null);
  if (!bmp) return f;
  const sc = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
  if (sc === 1 && f.size < 1_500_000) return f;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  const ctx = c.getContext("2d");
  if (!ctx) return f;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/webp", 0.86));
  if (!blob || blob.size >= f.size) return f;
  const ext = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], f.name.replace(/\.\w+$/, "") + "." + ext, { type: blob.type });
}

type Up = { phase: "idle" | "prep" | "up" | "done" | "err"; pct: number; msg: string; name: string; size: number };
const IDLE: Up = { phase: "idle", pct: 0, msg: "", name: "", size: 0 };
const fmt = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

export function ImgField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [up, setUp] = useState<Up>(IDLE);
  const ctl = useRef<AbortController | null>(null);
  const last = useRef<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const run = async (f: File) => {
    last.current = f;
    setUp({ phase: "prep", pct: 0, msg: "Checking your image", name: f.name, size: f.size });
    try {
      if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type)) throw new Error("Use a JPG, PNG, WebP, GIF or AVIF image.");
      if (f.size > 10 * 1024 * 1024) throw new Error("That image is over 10 MB.");
      const pre = await fetch("/api/upload").then(async (r) => ({ ...(await r.json()) })).catch(() => null);
      if (!pre) throw new Error("Could not reach the server. Check your connection.");
      if (pre.error) throw new Error(pre.error);
      if (!pre.blob) throw new Error("Image storage is not connected. In Vercel open Storage, create a Blob store, connect it to this project and redeploy.");
      setUp((u) => ({ ...u, msg: "Optimizing for fast loading" }));
      const file = await optimize(f);
      const ctrl = new AbortController();
      ctl.current = ctrl;
      let seen = Date.now();
      const watch = setInterval(() => { if (Date.now() - seen > 30000) ctrl.abort(); }, 1000);
      setUp({ phase: "up", pct: 0, msg: "Uploading", name: file.name, size: file.size });
      try {
        const b = await upload(`img/${file.name.replace(/[^\w.-]/g, "_")}`, file, {
          access: "public", handleUploadUrl: "/api/upload", abortSignal: ctrl.signal,
          onUploadProgress: (p) => { seen = Date.now(); setUp((u) => ({ ...u, pct: Math.round(p.percentage) })); },
        });
        onChange(b.url);
        setUp({ phase: "done", pct: 100, msg: "Uploaded", name: file.name, size: file.size });
        setTimeout(() => setUp((u) => (u.phase === "done" ? IDLE : u)), 2800);
      } finally { clearInterval(watch); }
    } catch (e) {
      const stopped = e instanceof Error && /abort/i.test(e.name + e.message);
      setUp({ phase: "err", pct: 0, msg: stopped ? "Upload stopped. The connection stalled or you cancelled it." : e instanceof Error ? e.message : "Upload failed.", name: f.name, size: f.size });
    } finally { if (input.current) input.current.value = ""; }
  };
  const busy = up.phase === "prep" || up.phase === "up";

  return (
    <Field label={label} error={httpsErr(value)} hint="JPG, PNG, WebP, GIF or AVIF up to 10 MB">
      <div className="imgf">
        {/^https:\/\//i.test(value) ? <img src={value} alt="" /> : <span className="ie" />}
        <input className="in" value={value} placeholder="https://..." onChange={(e) => onChange(e.target.value)} />
        <label className={"btn" + (busy ? " dis" : "")}>{busy ? "Working..." : "Upload"}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); }} />
        </label>
        {value && !busy && <button type="button" className="btn" onClick={() => onChange("")}>Clear</button>}
      </div>
      {up.phase !== "idle" && (
        <div className={`upl ${up.phase}`} role="status" aria-live="polite">
          <div className="ut">
            <span className="us">{up.phase === "done" ? <Gl n="check" s={16} /> : up.phase === "err" ? <Gl n="x" s={16} /> : <i className="spin" />}</span>
            <span className="um"><b>{up.msg}{up.phase === "up" ? ` ${up.pct}%` : ""}</b><small>{up.name} · {fmt(up.size)}</small></span>
            {busy && <button type="button" className="btn sm" onClick={() => ctl.current?.abort()}>Cancel</button>}
            {up.phase === "err" && <button type="button" className="btn sm" onClick={() => last.current && run(last.current)}>Try again</button>}
          </div>
          <div className="pb"><i className={up.phase === "prep" ? "ind" : ""} style={{ width: up.phase === "prep" ? "100%" : `${up.pct}%` }} /></div>
        </div>
      )}
    </Field>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sh" role="dialog" aria-label={title}>
        <header><button type="button" className="ib" onClick={onClose} aria-label="Back"><Gl n="back" /></button><h2>{title}</h2></header>
        <div className="sb">{children}</div>
      </div>
    </div>
  );
}
