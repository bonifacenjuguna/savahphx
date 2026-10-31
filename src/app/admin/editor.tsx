"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Page, { CardIcon, Chip, Ico, Mini, Powered } from "@/components/Page";
import { GROUPS, PLATFORMS, byId, resolveUrl, toHandle, type Platform } from "@/lib/platforms";
import { cleanRow } from "@/lib/rows";
import { BG_TYPES, DEMO_LAYOUTS, FONTS, LAYOUTS, PRESETS, RESET_GROUPS, STYLES, defaultSettings, normalize, type Layout, type Row, type Settings } from "@/lib/theme";
import { logout, saveAll, saveLayouts } from "./actions";

type Err = { title?: string; link?: string; image?: string; dup?: string };
type Panel = null | "profile" | "header" | "style" | "bg" | "icons" | "motion" | "footer" | "settings";
type Sub = null | "reset" | "layouts" | "backup" | "admin";

const blank = (): Row => ({ key: crypto.randomUUID(), platform: "", handle: "", title: "", url: "", icon: "", image: "", size: "full", visible: true, asIcon: false, color: false, shape: "" });
const httpsErr = (v: string) => (v && !/^https:\/\//i.test(v) ? "Must start with https://" : undefined);
const GL: Record<string, string> = {
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  header: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  style: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  icons: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  motion: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  footer: '<rect x="3" y="14" width="18" height="6" rx="3"/><path d="M3 5h18M3 9h10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  grip: '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
};
const Gl = ({ n, s = 20 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: GL[n] }} />
);

async function uploadImage(f: File) {
  if (f.size > 10 * 1024 * 1024) throw new Error("That image is over 10 MB.");
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type)) throw new Error("Use a JPG, PNG, WebP, GIF or AVIF image.");
  const b = await upload(`img/${f.name.replace(/[^\w.-]/g, "_")}`, f, { access: "public", handleUploadUrl: "/api/upload" });
  return b.url;
}

function validate(rows: Row[]) {
  const errs: Record<string, Err> = {};
  const seen = new Map<string, string>();
  for (const r of rows) {
    const e: Err = {};
    if (!r.title.trim()) e.title = "Add a title";
    const res = resolveUrl(byId(r.platform), r.handle, r.url);
    if (res.error) e.link = res.error;
    else {
      const k = res.url.toLowerCase();
      if (seen.has(k)) e.dup = `Same link as "${seen.get(k)}"`;
      else seen.set(k, r.title || "Untitled");
    }
    const ie = httpsErr(r.image);
    if (ie) e.image = ie;
    if (e.title || e.link || e.image || e.dup) errs[r.key] = e;
  }
  const hard = Object.values(errs).filter((e) => e.title || e.link || e.image).length;
  return { errs, hard };
}

/* ---------- web-made controls (no device pickers) ---------- */
function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly (T | { v: T; l: string })[] }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.v, l = typeof o === "string" ? o : o.l;
        return <button type="button" key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l || "Default"}</button>;
      })}
    </div>
  );
}
const Tgl = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={"tg" + (on ? " on" : "")} onClick={() => onChange(!on)}><b /></button>
);
const Switch = ({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) => (
  <div className="swr"><span><i>{label}</i>{hint && <small>{hint}</small>}</span><Tgl on={on} onChange={onChange} label={label} /></div>
);
const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div className={"f" + (error ? " bad" : "")}><span className="fl">{label}</span>{children}{error ? <em className="fe">{error}</em> : hint ? <small className="fh">{hint}</small> : null}</div>
);
const Range = ({ label, value, min, max, unit = "", onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) => (
  <div className="f"><span className="fl">{label}<b>{value}{unit}</b></span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} /></div>
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
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [o, setO] = useState(false);
  return (
    <div className="f"><span className="fl">{label}</span>
      <button type="button" className="cw" onClick={() => setO(true)}><span className="cs" style={{ background: value }} /><code>{value}</code></button>
      {o && <ColorModal label={label} value={value} onChange={onChange} onClose={() => setO(false)} />}
    </div>
  );
}

function ImgField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Field label={label} error={err || httpsErr(value)} hint="JPG, PNG, WebP, GIF or AVIF up to 10 MB">
      <div className="imgf">
        {/^https:\/\//i.test(value) ? <img src={value} alt="" /> : <span className="ie" />}
        <input className="in" value={value} placeholder="https://..." onChange={(e) => { setErr(""); onChange(e.target.value); }} />
        <label className="btn">{busy ? "Uploading..." : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true); setErr("");
            try { onChange(await uploadImage(f)); } catch (x) { setErr(x instanceof Error && x.message.startsWith("That") || (x instanceof Error && x.message.startsWith("Use")) ? x.message : "Upload failed. Check your connection and that Blob storage is connected."); }
            setBusy(false);
          }} />
        </label>
        {value && <button type="button" className="btn" onClick={() => onChange("")}>Clear</button>}
      </div>
    </Field>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function Picker({ onPick, onClose }: { onPick: (p: Platform) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = PLATFORMS.filter((p) => p.label.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <Sheet title="Choose a platform" onClose={onClose}>
      <input className="in" placeholder="Search platforms" value={q} onChange={(e) => setQ(e.target.value)} />
      {GROUPS.map((g) => {
        const items = list.filter((p) => p.group === g);
        return items.length ? (
          <section key={g}><h3 className="gh">{g}</h3>
            <div className="pks">{items.map((p) => (
              <button type="button" key={p.id} className="pk" onClick={() => onPick(p)}>
                <span className="th"><Ico r={{ ...blank(), platform: p.id }} ink="ffffff" className="ti" /></span><span>{p.label}</span>
              </button>
            ))}</div>
          </section>
        ) : null;
      })}
      {!list.length && <p className="mut">No match. Use "Custom link" for anything else.</p>}
    </Sheet>
  );
}

function LinkSheet({ r, t, e, tried, upd, onClose, del, dup, pick }: { r: Row; t: Settings; e: Err; tried: boolean; upd: (p: Partial<Row>) => void; onClose: () => void; del: () => void; dup: () => void; pick: () => void }) {
  const [sure, setSure] = useState(false);
  const p = byId(r.platform);
  const kind = p?.kind ?? "url";
  const res = resolveUrl(p, r.handle, r.url);
  const linkErr = e.link && (tried || r.handle || r.url) ? e.link : undefined;
  return (
    <Sheet title={r.title || "New link"} onClose={onClose}>
      <button type="button" className="pf" onClick={pick}>
        <span className="th"><Ico r={r} ink="ffffff" className="ti" /></span>
        <span><b>{p?.label ?? "Custom link"}</b><small>Tap to change platform</small></span>
      </button>
      <Field label="Title" error={tried ? e.title : undefined}>
        <input className="in" value={r.title} placeholder="Shown on your page" onChange={(x) => upd({ title: x.target.value })} />
      </Field>
      {kind === "handle" && p && (
        <Field label={p.id === "whatsapp" ? "Number (with country code)" : "Username"} error={linkErr} hint={res.url ? `Opens ${res.url}` : p.ph ? `Example: ${p.ph}` : undefined}>
          <div className="adorn">{p.at && <span>@</span>}
            <input value={r.handle} placeholder={p.ph} autoCapitalize="none" autoCorrect="off" spellCheck={false}
              onChange={(x) => upd({ handle: x.target.value })}
              onBlur={() => upd({ handle: p.id === "whatsapp" ? r.handle.replace(/[^\d+]/g, "") : toHandle(p, r.handle) })} />
          </div>
        </Field>
      )}
      {(kind === "mail" || kind === "phone") && p && (
        <Field label={kind === "mail" ? "Email address" : "Phone number"} error={linkErr} hint={res.url ? `Opens ${res.url}` : undefined}>
          <input className="in" value={r.handle} placeholder={p.ph} inputMode={kind === "mail" ? "email" : "tel"} autoCapitalize="none" onChange={(x) => upd({ handle: x.target.value })} />
        </Field>
      )}
      {kind === "url" && (
        <Field label="Link" error={linkErr} hint="Paste the full link">
          <input className="in" value={r.url} placeholder="https://" autoCapitalize="none" inputMode="url"
            onChange={(x) => upd({ url: x.target.value })}
            onBlur={() => { const v = r.url.trim(); if (v && !/^[a-z]+:/i.test(v) && v.includes(".")) upd({ url: "https://" + v }); }} />
        </Field>
      )}
      {e.dup && <p className="warn">{e.dup}</p>}

      <h3 className="gh">Logo</h3>
      <Mini t={t}>
        <CardIcon r={r} t={t} />
        <Chip s={r} t={t} inert />
      </Mini>
      <Field label="Style"><Seg value={r.color ? "color" : "plain"} onChange={(v) => upd({ color: v === "color" })} options={[{ v: "plain", l: "Normal" }, { v: "color", l: "Colored" }]} /></Field>
      <Field label="Shape"><Seg value={r.shape} onChange={(v) => upd({ shape: v })} options={[{ v: "", l: "Default" }, { v: "circle", l: "Round" }, { v: "rounded", l: "Rounded" }, { v: "square", l: "Square" }]} /></Field>
      {kind === "url" && <Field label="Logo name (optional)" hint="Any brand name, e.g. notion or spotify"><input className="in" value={r.icon} autoCapitalize="none" onChange={(x) => upd({ icon: x.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })} /></Field>}
      <ImgField label="Custom image (replaces the logo)" value={r.image} onChange={(v) => upd({ image: v })} />

      <h3 className="gh">Layout</h3>
      <Field label="Card size" hint="Half cards pair up and thirds group in threes. A leftover one goes full width.">
        <Seg value={r.size} onChange={(v) => upd({ size: v })} options={[{ v: "full", l: "Wide" }, { v: "half", l: "Half" }, { v: "third", l: "Third" }]} />
      </Field>
      <Switch on={r.visible} onChange={(v) => upd({ visible: v })} label="Show as card" />
      <Switch on={r.asIcon} onChange={(v) => upd({ asIcon: v })} label="Show in icon row" hint="Adds a shortcut icon under your bio" />

      <div className="acts2">
        <button type="button" className="btn" onClick={dup}>Duplicate</button>
        {sure ? <button type="button" className="btn danger on" onClick={del}>Tap again to delete</button> : <button type="button" className="btn danger" onClick={() => setSure(true)}>Delete</button>}
        <button type="button" className="btn pri" onClick={onClose}>Done</button>
      </div>
    </Sheet>
  );
}

function Item({ r, err, tried, open }: { r: Row; err?: Err; tried: boolean; open: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.key });
  const p = byId(r.platform);
  const v = p && p.kind !== "url" ? (p.kind === "handle" ? `${p.at ? "@" : ""}${toHandle(p, r.handle)}` : r.handle) : r.url.replace(/^https?:\/\//, "");
  const bad = tried && !!(err?.title || err?.link || err?.image);
  return (
    <div ref={setNodeRef} className={"lr" + (bad ? " bad" : "") + (isDragging ? " drag" : "")} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder"><Gl n="grip" s={18} /></button>
      <button type="button" className="lm" onClick={open}>
        <span className="th"><Ico r={r} ink="ffffff" className="ti" /></span>
        <span className="lt"><b>{r.title || "Untitled"}</b><small>{p?.label ?? "Custom link"}{v ? ` · ${v}` : ""}</small></span>
        <span className="tags">
          {bad && <i className="tag red">Fix</i>}
          {r.asIcon && <i className="tag">Icon</i>}
          {!r.visible && <i className="tag">Hidden</i>}
          {r.size !== "full" && <i className="tag">{r.size === "half" ? "1/2" : "1/3"}</i>}
        </span>
      </button>
    </div>
  );
}

function List({ rows, errs, tried, setRows, open }: { rows: Row[]; errs: Record<string, Err>; tried: boolean; setRows: (r: Row[]) => void; open: (k: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setRows(arrayMove(rows, rows.findIndex((r) => r.key === active.id), rows.findIndex((r) => r.key === over.id)));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
        {rows.map((r) => <Item key={r.key} r={r} err={errs[r.key]} tried={tried} open={() => open(r.key)} />)}
      </SortableContext>
    </DndContext>
  );
}

const ACCENTS = ["#8ab4ff", "#a78bfa", "#34d399", "#fb923c", "#f472b6", "#facc15"];

export default function Editor({ initial, initialSettings, initialLayouts }: { initial: Row[]; initialSettings: Settings; initialLayouts: Layout[] }) {
  const [rows, setRows] = useState(initial);
  const [s, setS] = useState(initialSettings);
  const snap = JSON.stringify({ rows, s });
  const [base, setBase] = useState(snap);
  const dirty = snap !== base;
  const [panel, setPanel] = useState<Panel>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [pickKey, setPickKey] = useState<string | null>(null);
  const [pv, setPv] = useState(false);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, start] = useTransition();
  const [layouts, setLayouts] = useState(initialLayouts);
  const [lname, setLname] = useState("");
  const [rs, setRs] = useState<Record<string, boolean>>({});
  const [prefs, setPrefs] = useState({ accent: "#8ab4ff", compact: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (m: string) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 3400); };
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("adm-prefs") || "{}");
      setPrefs((p) => ({ accent: /^#[0-9a-f]{6}$/i.test(v.accent) ? v.accent : p.accent, compact: !!v.compact }));
    } catch {}
  }, []);
  const setPref = (patch: Partial<typeof prefs>) => setPrefs((p) => { const n = { ...p, ...patch }; try { localStorage.setItem("adm-prefs", JSON.stringify(n)); } catch {} return n; });
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const { errs, hard } = validate(rows);
  const sErr = { avatar: httpsErr(s.avatar), banner: httpsErr(s.banner), bgImage: httpsErr(s.bgImage), poweredUrl: httpsErr(s.poweredUrl), poweredLogo: httpsErr(s.poweredLogo) };
  const sCount = Object.values(sErr).filter(Boolean).length;

  const upd = (key: string, patch: Partial<Row>) =>
    setRows((rs0) => rs0.map((r) => {
      if (r.key !== key) return r;
      const n = { ...r, ...patch };
      const p = byId(n.platform);
      if (p && p.kind !== "url" && ("handle" in patch || "platform" in patch)) { const x = resolveUrl(p, n.handle, n.url); n.url = x.error ? "" : x.url; }
      return n;
    }));
  const choose = (key: string, p: Platform) => {
    const cur = rows.find((r) => r.key === key);
    if (!cur) return;
    const handle = p.kind === "url" ? "" : cur.handle || (cur.url ? toHandle(p, cur.url.replace(/^(mailto|tel):/, "")) : "");
    upd(key, { platform: p.id, icon: "", title: cur.title || p.label, handle });
    setPickKey(null);
  };
  const add = () => { const r = blank(); setRows((x) => [...x, r]); setLinkKey(r.key); setPickKey(r.key); };
  const dup = (key: string) => {
    const i = rows.findIndex((r) => r.key === key);
    if (i < 0) return;
    const c = { ...rows[i], key: crypto.randomUUID(), title: rows[i].title + " copy" };
    setRows([...rows.slice(0, i + 1), c, ...rows.slice(i + 1)]);
    setLinkKey(c.key);
  };

  const save = () => {
    setTried(true);
    const n = hard + sCount;
    if (n) {
      const bad = rows.find((r) => errs[r.key] && (errs[r.key].title || errs[r.key].link || errs[r.key].image));
      if (bad) setLinkKey(bad.key); else setPanel(sErr.bgImage ? "bg" : sErr.poweredUrl || sErr.poweredLogo ? "footer" : "profile");
      say(`Fix ${n} issue${n > 1 ? "s" : ""} before saving`);
      return;
    }
    start(async () => {
      try { await saveAll({ rows, settings: s }); setBase(snap); setTried(false); say("Saved. Your site is updated."); }
      catch { say("Could not save. Check your connection and try again."); }
    });
  };
  const discard = () => { const b = JSON.parse(base); setRows(b.rows); setS(b.s); setTried(false); setLinkKey(null); };

  /* reset */
  const doReset = (ids: string[]) => {
    setS((p) => { const n: Record<string, unknown> = { ...p }; for (const g of RESET_GROUPS) if (ids.includes(g.id)) for (const k of g.keys) n[k] = defaultSettings[k]; return n as Settings; });
    if (ids.includes("links")) setRows([]);
    setRs({}); setSub(null);
    say("Reset done. Save changes to keep it, or Discard to undo.");
  };
  /* layouts */
  const persist = async (list: Layout[]) => { try { await saveLayouts(list); setLayouts(list); return true; } catch { say("Could not save layouts. Try again."); return false; } };
  const saveLayout = async () => {
    const name = lname.trim();
    if (!name) return say("Give the layout a name first");
    if (layouts.length >= 20) return say("Layout limit reached. Delete one first.");
    const l: Layout = { id: crypto.randomUUID(), name, at: Date.now(), s: { ...s }, rows: rows.map((r) => ({ ...r })) };
    if (await persist([l, ...layouts])) { setLname(""); say(`Saved layout "${name}"`); }
  };
  const applyLayout = (l: Layout, withLinks: boolean) => {
    setS(normalize(l.s));
    if (withLinks && l.rows) setRows(l.rows.map(cleanRow));
    setSub(null);
    say(withLinks ? "Applied design and links. Save changes to publish." : "Applied. Save changes to publish.");
  };
  /* backup */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ v: 3, rows, s, layouts }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "savahphx-backup.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const d = JSON.parse(await f.text());
      if (Array.isArray(d.rows)) setRows(d.rows.slice(0, 80).map(cleanRow));
      if (d.s) setS(normalize(d.s));
      setSub(null); say("Imported. Review it, then Save changes.");
    } catch { say("That file is not a valid backup."); }
  };

  const active = (v: Partial<Settings>) => Object.entries(v).every(([k, x]) => s[k as keyof Settings] === x);
  const cur = rows.find((r) => r.key === linkKey);
  const iconCount = rows.filter((r) => r.asIcon).length;
  const tiles: { id: Exclude<Panel, null>; name: string; val: string }[] = [
    { id: "profile", name: "Profile", val: s.name || s.title },
    { id: "header", name: "Header", val: s.showHeader ? `${s.header} layout` : "Hidden" },
    { id: "style", name: "Style", val: STYLES.find((x) => x.id === s.style)?.name ?? "" },
    { id: "bg", name: "Background", val: s.bgType },
    { id: "icons", name: "Icon row", val: s.socialPos === "off" ? "Off" : `${iconCount} icon${iconCount === 1 ? "" : "s"} · ${s.socialPos}` },
    { id: "motion", name: "Motion", val: `${s.entrance ? "Entrance" : "No entrance"} · ${s.hover ? "Hover" : "No hover"}` },
    { id: "footer", name: "Footer tag", val: s.poweredShow ? `${s.poweredText} ${s.poweredName}` : "Hidden" },
    { id: "settings", name: "Settings", val: `${layouts.length} saved layout${layouts.length === 1 ? "" : "s"}` },
  ];
  const close = () => { setPanel(null); setSub(null); };
  const dots = (v: Partial<Settings>) => <span className="dots3">{[v.bg, v.accent, v.text].map((c, i) => <i key={i} style={{ background: c }} />)}</span>;

  return (
    <div className={"app" + (prefs.compact ? " compact" : "")} style={{ "--ac": prefs.accent } as React.CSSProperties}>
      <header className="top">
        <div><h1>Dashboard</h1><span className={"pill" + (dirty ? " warn" : "")}>{dirty ? "Unsaved changes" : "All changes saved"}</span></div>
        <div className="acts"><a className="btn" href="/" target="_blank">View site</a><form action={logout}><button className="btn">Sign out</button></form></div>
      </header>

      <div className="shell">
        <div className="main">
          <section className="panel">
            <div className="ph"><h2>Links</h2><button type="button" className="btn pri" onClick={add}>Add link</button></div>
            <p className="mut">Tap a link to edit it. Drag the handle to reorder.</p>
            <List rows={rows} errs={errs} tried={tried} setRows={setRows} open={setLinkKey} />
            {!rows.length && <p className="mut empty">No links yet. Tap Add link to start.</p>}
          </section>
          <section className="panel">
            <h2>Design</h2>
            <div className="tiles">
              {tiles.map((x) => (
                <button type="button" key={x.id} className="tile" onClick={() => setPanel(x.id)}>
                  <Gl n={x.id} s={22} /><b>{x.name}</b><small>{x.val}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className={"pv" + (pv ? " show" : "")}>
          <button type="button" className="btn closepv" onClick={() => setPv(false)}>Close preview</button>
          <div className="phone"><Page rows={rows} t={s} embedded /></div>
        </aside>
      </div>

      {dirty && (
        <div className="savebar">
          <button type="button" className="btn" onClick={discard}>Discard</button>
          <span className="sp" />
          <button type="button" className="btn onlym" onClick={() => setPv(true)}>Preview</button>
          <button type="button" className="btn pri" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}

      {panel === "profile" && (
        <Sheet title="Profile" onClose={close}>
          <p className="mut">Empty fields hide on their own, and everything below moves up to fill the space.</p>
          <Switch on={s.showName} onChange={(v) => set("showName", v)} label="Show name" />
          <Field label="Name" hint="Shown above your bio"><input className="in" value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Switch on={s.showTitle} onChange={(v) => set("showTitle", v)} label="Show bio" />
          <Field label="Bio"><input className="in" value={s.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Switch on={s.showBio} onChange={(v) => set("showBio", v)} label="Show extra lines" />
          <Field label="Extra lines" hint="Optional, e.g. UID or location"><textarea className="in" rows={3} value={s.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
          <Switch on={s.showAvatar} onChange={(v) => set("showAvatar", v)} label="Show profile photo" />
          <ImgField label="Profile photo" value={s.avatar} onChange={(v) => set("avatar", v)} />
          <Switch on={s.showBanner} onChange={(v) => set("showBanner", v)} label="Show banner" />
          <ImgField label="Banner image" value={s.banner} onChange={(v) => set("banner", v)} />
          <Field label="Font"><Seg value={s.font} onChange={(v) => set("font", v)} options={FONTS.map((f) => ({ v: f, l: { sora: "Sora", inter: "Inter", space: "Space", dm: "DM Sans", playfair: "Serif" }[f] }))} /></Field>
          <Range label="Bio size" value={s.titleSize} min={14} max={56} unit="px" onChange={(v) => set("titleSize", v)} />
          <Range label="Extra line size" value={s.bioSize} min={11} max={24} unit="px" onChange={(v) => set("bioSize", v)} />
          <Switch on={s.upper} onChange={(v) => set("upper", v)} label="Uppercase bio" />
        </Sheet>
      )}

      {panel === "header" && (
        <Sheet title="Header" onClose={close}>
          <Switch on={s.showHeader} onChange={(v) => set("showHeader", v)} label="Show header" hint="Turn off to start straight with your links" />
          <Mini t={s}>{s.avatar ? <img className="av" src={s.avatar} alt="" /> : <div className="av" />}</Mini>
          <Field label="Layout" hint="Banner, Side and Card use your banner image. Hero uses it as the full header."><Seg value={s.header} onChange={(v) => set("header", v)} options={LAYOUTS} /></Field>
          <Field label="Text alignment"><Seg value={s.align} onChange={(v) => set("align", v)} options={["left", "center", "right"] as const} /></Field>
          <Field label="Photo position"><Seg value={s.avatarPos} onChange={(v) => set("avatarPos", v)} options={["left", "center", "right"] as const} /></Field>
          <Field label="Photo shape"><Seg value={s.avatarShape} onChange={(v) => set("avatarShape", v)} options={["circle", "rounded", "square"] as const} /></Field>
          <Range label="Photo size" value={s.avatarSize} min={64} max={200} unit="px" onChange={(v) => set("avatarSize", v)} />
          <Switch on={s.avatarGlow} onChange={(v) => set("avatarGlow", v)} label="Photo glow" />
        </Sheet>
      )}

      {panel === "style" && (
        <Sheet title="Style" onClose={close}>
          <div className="stys">
            {STYLES.map((x) => (
              <button type="button" key={x.id} className={"sty" + (s.style === x.id ? " on" : "")} aria-pressed={s.style === x.id} onClick={() => setS((p) => normalize({ ...p, ...x.v, style: x.id }))}>
                {dots(x.v)}{x.name}
              </button>
            ))}
          </div>
          <h3 className="gh">Color palettes</h3>
          <div className="stys">
            {PRESETS.map((x) => (
              <button type="button" key={x.name} className={"sty" + (active(x.v) ? " on" : "")} aria-pressed={active(x.v)} onClick={() => setS((p) => normalize({ ...p, ...x.v }))}>
                {dots(x.v)}{x.name}
              </button>
            ))}
          </div>
          <h3 className="gh">Main colors</h3>
          <div className="g2">
            <Color label="Background" value={s.bg} onChange={(v) => set("bg", v)} />
            <Color label="Accent" value={s.accent} onChange={(v) => set("accent", v)} />
            <Color label="Text" value={s.text} onChange={(v) => set("text", v)} />
          </div>
          <h3 className="gh">More colors</h3>
          <div className="g2">
            <Color label="Second background" value={s.bg2} onChange={(v) => set("bg2", v)} />
            <Color label="Second accent" value={s.accent2} onChange={(v) => set("accent2", v)} />
            <Color label="Surface tint" value={s.glassTint} onChange={(v) => set("glassTint", v)} />
          </div>
          <Range label="Corner radius" value={s.radius} min={0} max={40} unit="px" onChange={(v) => set("radius", v)} />
          {s.style === "glass" && <>
            <Range label="Glass blur" value={s.glassBlur} min={0} max={40} unit="px" onChange={(v) => set("glassBlur", v)} />
            <Range label="Glass opacity" value={s.glassOpacity} min={0} max={80} unit="%" onChange={(v) => set("glassOpacity", v)} />
            <Range label="Glass edge" value={s.glassBorder} min={0} max={60} unit="%" onChange={(v) => set("glassBorder", v)} />
          </>}
        </Sheet>
      )}

      {panel === "bg" && (
        <Sheet title="Background" onClose={close}>
          <Field label="Type"><Seg value={s.bgType} onChange={(v) => set("bgType", v)} options={BG_TYPES} /></Field>
          <div className="g2"><Color label="Base color" value={s.bg} onChange={(v) => set("bg", v)} /><Color label="Second color" value={s.bg2} onChange={(v) => set("bg2", v)} /></div>
          <ImgField label="Background image" value={s.bgImage} onChange={(v) => set("bgImage", v)} />
          <Range label="Image dim" value={s.bgDim} min={0} max={90} unit="%" onChange={(v) => set("bgDim", v)} />
          <Range label="Image blur" value={s.bgBlur} min={0} max={30} unit="px" onChange={(v) => set("bgBlur", v)} />
          {s.style === "neu" && <p className="mut">Neumorphism uses a solid base color so the soft shadows work.</p>}
        </Sheet>
      )}

      {panel === "icons" && (
        <Sheet title="Icon row" onClose={close}>
          <Mini t={s}>
            {rows.filter((r) => r.asIcon).map((r) => <Chip key={r.key} s={r} t={s} inert />)}
            {!iconCount && <span className="mut">Switch links on below to see them here.</span>}
          </Mini>
          <Field label="Placement"><Seg value={s.socialPos} onChange={(v) => set("socialPos", v)} options={["top", "bottom", "both", "off"] as const} /></Field>
          <Field label="Look"><Seg value={s.socialStyle} onChange={(v) => set("socialStyle", v)} options={[{ v: "chip", l: "Chips" }, { v: "plain", l: "Plain" }]} /></Field>
          <Field label="Default shape"><Seg value={s.iconShape} onChange={(v) => set("iconShape", v)} options={["circle", "rounded", "square"] as const} /></Field>
          <Range label="Size" value={s.socialSize} min={32} max={72} unit="px" onChange={(v) => set("socialSize", v)} />
          <div className="line2"><button type="button" className="btn" onClick={() => setRows((x) => x.map((r) => ({ ...r, color: true })))}>Colored logos for all</button><button type="button" className="btn" onClick={() => setRows((x) => x.map((r) => ({ ...r, color: false })))}>Normal logos for all</button></div>
          <h3 className="gh">Show in icon row</h3>
          {rows.map((r) => (
            <div className="ir" key={r.key}><span className="th"><Ico r={r} ink="ffffff" className="ti" /></span><b>{r.title || "Untitled"}</b><Tgl on={r.asIcon} onChange={(v) => upd(r.key, { asIcon: v })} label={r.title} /></div>
          ))}
          {!rows.length && <p className="mut">Add links first, then switch them on here.</p>}
        </Sheet>
      )}

      {panel === "motion" && (
        <Sheet title="Motion" onClose={close}>
          <Switch on={s.entrance} onChange={(v) => set("entrance", v)} label="Entrance animation" hint="Cards fade in one by one" />
          <Switch on={s.hover} onChange={(v) => set("hover", v)} label="Hover animation" hint="Cards and icons lift when touched" />
        </Sheet>
      )}

      {panel === "footer" && (
        <Sheet title="Footer tag" onClose={close}>
          <Mini t={s}><Powered t={s} inline /></Mini>
          <Switch on={s.poweredShow} onChange={(v) => set("poweredShow", v)} label="Show footer tag" />
          <Field label="Position"><Seg value={s.poweredPos} onChange={(v) => set("poweredPos", v)} options={[{ v: "corner", l: "Bottom corner" }, { v: "footer", l: "End of page" }]} /></Field>
          <Field label="Text"><input className="in" value={s.poweredText} onChange={(e) => set("poweredText", e.target.value)} /></Field>
          <Field label="Name"><input className="in" value={s.poweredName} onChange={(e) => set("poweredName", e.target.value)} /></Field>
          <Field label="Link" error={sErr.poweredUrl} hint="Makes the whole tag clickable. Leave empty for no link."><input className="in" value={s.poweredUrl} placeholder="https://" autoCapitalize="none" onChange={(e) => set("poweredUrl", e.target.value)} /></Field>
          <ImgField label="Logo" value={s.poweredLogo} onChange={(v) => set("poweredLogo", v)} />
        </Sheet>
      )}

      {panel === "settings" && (
        <Sheet title="Settings" onClose={close}>
          {([
            ["layouts", "Saved layouts", "Save your design under a name and come back to it anytime"],
            ["reset", "Reset", "Choose what to reset, or reset all design"],
            ["backup", "Backup", "Export or import everything as a file"],
            ["admin", "Admin look", "Accent color and compact lists for this dashboard"],
          ] as [Sub, string, string][]).map(([id, n, d]) => (
            <button type="button" key={id} className="mi" onClick={() => setSub(id)}><span><b>{n}</b><small>{d}</small></span><Gl n="chev" /></button>
          ))}
        </Sheet>
      )}

      {sub === "reset" && (
        <Sheet title="Reset" onClose={() => setSub(null)}>
          <p className="mut">Pick what to reset. Nothing is final until you press Save changes, and Discard undoes it.</p>
          {[...RESET_GROUPS, { id: "links", name: "All links (removes every link)", keys: [] }].map((g) => (
            <div className="ir" key={g.id}><b>{g.name}</b><Tgl on={!!rs[g.id]} onChange={(v) => setRs((p) => ({ ...p, [g.id]: v }))} label={g.name} /></div>
          ))}
          <div className="acts2">
            <button type="button" className="btn danger" disabled={!Object.values(rs).some(Boolean)} onClick={() => doReset(Object.keys(rs).filter((k) => rs[k]))}>Reset selected</button>
            <button type="button" className="btn" onClick={() => doReset(RESET_GROUPS.map((g) => g.id))}>Reset all design</button>
          </div>
        </Sheet>
      )}

      {sub === "layouts" && (
        <Sheet title="Saved layouts" onClose={() => setSub(null)}>
          <Field label="Save the current design" hint="Includes your links too, so you can restore either one.">
            <div className="imgf"><input className="in" value={lname} maxLength={40} placeholder="Name, e.g. Summer look" onChange={(e) => setLname(e.target.value)} /><button type="button" className="btn pri" onClick={saveLayout}>Save</button></div>
          </Field>
          {layouts.length > 0 && <h3 className="gh">Your layouts</h3>}
          {layouts.map((l) => (
            <div className={"lay" + (JSON.stringify(normalize(l.s)) === JSON.stringify(s) ? " on" : "")} key={l.id}>
              <div className="lh">{dots(l.s)}<b>{l.name}</b>{JSON.stringify(normalize(l.s)) === JSON.stringify(s) && <i className="tag">Current</i>}</div>
              <div className="line2">
                <button type="button" className="btn" onClick={() => applyLayout(l, false)}>Apply design</button>
                {l.rows && <button type="button" className="btn" onClick={() => applyLayout(l, true)}>Apply with links</button>}
                <button type="button" className="btn danger" onClick={() => persist(layouts.filter((x) => x.id !== l.id)).then((ok) => ok && say("Layout deleted"))}>Delete</button>
              </div>
            </div>
          ))}
          <h3 className="gh">Demo layouts</h3>
          {DEMO_LAYOUTS.map((l) => (
            <div className={"lay" + (JSON.stringify(normalize(l.s)) === JSON.stringify(s) ? " on" : "")} key={l.id}>
              <div className="lh">{dots(l.s)}<b>{l.name}</b><i className="tag">Demo</i></div>
              <div className="line2"><button type="button" className="btn" onClick={() => applyLayout(l, false)}>Apply design</button></div>
            </div>
          ))}
        </Sheet>
      )}

      {sub === "backup" && (
        <Sheet title="Backup" onClose={() => setSub(null)}>
          <p className="mut">Download everything (links, design and saved layouts) as a file, or restore one. Importing needs Save changes to go live.</p>
          <div className="line2">
            <button type="button" className="btn pri" onClick={exportJson}>Export backup</button>
            <label className="btn">Import backup<input type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importJson(f); }} /></label>
          </div>
        </Sheet>
      )}

      {sub === "admin" && (
        <Sheet title="Admin look" onClose={() => setSub(null)}>
          <Field label="Dashboard accent">
            <div className="sws big">{ACCENTS.map((c) => <button type="button" key={c} aria-label={c} aria-pressed={prefs.accent === c} className={prefs.accent === c ? "on" : ""} style={{ background: c }} onClick={() => setPref({ accent: c })} />)}</div>
          </Field>
          <Color label="Custom accent" value={prefs.accent} onChange={(v) => setPref({ accent: v })} />
          <Switch on={prefs.compact} onChange={(v) => setPref({ compact: v })} label="Compact lists" hint="Smaller link rows so more fit on screen" />
          <p className="mut">These only change this dashboard on this device. They never affect your public page.</p>
        </Sheet>
      )}

      {cur && <LinkSheet r={cur} t={s} e={errs[cur.key] ?? {}} tried={tried} upd={(p) => upd(cur.key, p)} onClose={() => setLinkKey(null)}
        del={() => { setRows((x) => x.filter((r) => r.key !== cur.key)); setLinkKey(null); }} dup={() => dup(cur.key)} pick={() => setPickKey(cur.key)} />}
      {pickKey && <Picker onPick={(p) => choose(pickKey, p)} onClose={() => setPickKey(null)} />}
    </div>
  );
}
