"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Page, { Ico } from "@/components/Page";
import { GROUPS, PLATFORMS, byId, resolveUrl, toHandle, type Platform } from "@/lib/platforms";
import { BG_TYPES, FONTS, LAYOUTS, PRESETS, STYLES, normalize, type Row, type Settings } from "@/lib/theme";
import { logout, saveAll, upload } from "./actions";

type Err = { title?: string; link?: string; image?: string; dup?: string };
type Panel = null | "profile" | "header" | "style" | "bg" | "icons" | "motion";

const blank = (): Row => ({ key: crypto.randomUUID(), platform: "", handle: "", title: "", url: "", icon: "", image: "", size: "full", visible: true, asIcon: false, color: false, shape: "" });
const httpsErr = (v: string) => (v && !/^https:\/\//i.test(v) ? "Must start with https://" : undefined);
const GL: Record<string, string> = {
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  header: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  style: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  icons: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  motion: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  grip: '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>',
};
const Gl = ({ n, s = 20 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: GL[n] }} />
);

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
const Color = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="f colr"><span className="fl">{label}</span><span className="cw"><span className="cs" style={{ background: value }}><input type="color" value={value} onChange={(e) => onChange(e.target.value)} /></span><code>{value}</code></span></label>
);

function ImgField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Field label={label} error={err || httpsErr(value)}>
      <div className="imgf">
        {/^https:\/\//i.test(value) ? <img src={value} alt="" /> : <span className="ie" />}
        <input className="in" value={value} placeholder="https://..." onChange={(e) => { setErr(""); onChange(e.target.value); }} />
        <label className="btn">{busy ? "..." : "Upload"}
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true); setErr("");
            const fd = new FormData(); fd.append("file", f);
            try { onChange(await upload(fd)); } catch { setErr("Upload failed. Use an image under 4 MB."); }
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

function LinkSheet({ r, e, tried, upd, onClose, del, dup, pick }: { r: Row; e: Err; tried: boolean; upd: (p: Partial<Row>) => void; onClose: () => void; del: () => void; dup: () => void; pick: () => void }) {
  const [sure, setSure] = useState(false);
  const p = byId(r.platform);
  const kind = p?.kind ?? "url";
  const res = resolveUrl(p, r.handle, r.url);
  const typed = !!(r.handle || r.url);
  const linkErr = e.link && (tried || typed) ? e.link : undefined;
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

export default function Editor({ initial, initialSettings }: { initial: Row[]; initialSettings: Settings }) {
  const [rows, setRows] = useState(initial);
  const [s, setS] = useState(initialSettings);
  const snap = JSON.stringify({ rows, s });
  const [base, setBase] = useState(snap);
  const dirty = snap !== base;
  const [panel, setPanel] = useState<Panel>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [pickKey, setPickKey] = useState<string | null>(null);
  const [pv, setPv] = useState(false);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (m: string) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 3200); };
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const { errs, hard } = validate(rows);
  const sErr = { avatar: httpsErr(s.avatar), banner: httpsErr(s.banner), bgImage: httpsErr(s.bgImage) };
  const sCount = Object.values(sErr).filter(Boolean).length;

  const upd = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => {
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
  const add = () => { const r = blank(); setRows((rs) => [...rs, r]); setLinkKey(r.key); setPickKey(r.key); };
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
      if (bad) setLinkKey(bad.key); else setPanel(sErr.bgImage ? "bg" : "profile");
      say(`Fix ${n} issue${n > 1 ? "s" : ""} before saving`);
      return;
    }
    start(async () => {
      try { await saveAll({ rows, settings: s }); setBase(snap); setTried(false); say("Saved. Your site is updated."); }
      catch { say("Could not save. Check your connection and try again."); }
    });
  };
  const discard = () => { const b = JSON.parse(base); setRows(b.rows); setS(b.s); setTried(false); setLinkKey(null); };

  const cur = rows.find((r) => r.key === linkKey);
  const iconCount = rows.filter((r) => r.asIcon).length;
  const tiles: { id: Exclude<Panel, null>; name: string; val: string }[] = [
    { id: "profile", name: "Profile", val: s.name || s.title },
    { id: "header", name: "Header", val: `${s.header} layout` },
    { id: "style", name: "Style", val: STYLES.find((x) => x.id === s.style)?.name ?? "" },
    { id: "bg", name: "Background", val: s.bgType },
    { id: "icons", name: "Icon row", val: `${iconCount} icon${iconCount === 1 ? "" : "s"} · ${s.socialPos}` },
    { id: "motion", name: "Motion", val: `${s.entrance ? "Entrance" : "No entrance"} · ${s.hover ? "Hover" : "No hover"}` },
  ];
  const close = () => setPanel(null);

  return (
    <>
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
              {tiles.map((t) => (
                <button type="button" key={t.id} className="tile" onClick={() => setPanel(t.id)}>
                  <Gl n={t.id} s={22} /><b>{t.name}</b><small>{t.val}</small>
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
          <Field label="Name" hint="Shown above your bio. Leave empty to hide."><input className="in" value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Bio"><input className="in" value={s.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Extra lines" hint="Optional, e.g. UID or location"><textarea className="in" rows={3} value={s.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
          <ImgField label="Profile photo" value={s.avatar} onChange={(v) => set("avatar", v)} />
          <ImgField label="Banner image" value={s.banner} onChange={(v) => set("banner", v)} />
          <Field label="Font"><Seg value={s.font} onChange={(v) => set("font", v)} options={FONTS.map((f) => ({ v: f, l: { sora: "Sora", inter: "Inter", space: "Space", dm: "DM Sans", playfair: "Serif" }[f] }))} /></Field>
          <Range label="Bio size" value={s.titleSize} min={14} max={56} unit="px" onChange={(v) => set("titleSize", v)} />
          <Range label="Extra line size" value={s.bioSize} min={11} max={24} unit="px" onChange={(v) => set("bioSize", v)} />
          <Switch on={s.upper} onChange={(v) => set("upper", v)} label="Uppercase bio" />
        </Sheet>
      )}

      {panel === "header" && (
        <Sheet title="Header" onClose={close}>
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
              <button type="button" key={x.id} className={"sty" + (s.style === x.id ? " on" : "")} onClick={() => setS((p) => normalize({ ...p, ...x.v, style: x.id }))}>
                <span className="dots3">{[x.v.bg, x.v.accent, x.v.text].map((c, i) => <i key={i} style={{ background: c }} />)}</span>{x.name}
              </button>
            ))}
          </div>
          <h3 className="gh">Color palettes</h3>
          <div className="stys">{PRESETS.map((x) => <button type="button" key={x.name} className="sty" onClick={() => setS((p) => normalize({ ...p, ...x.v }))}><span className="dots3">{[x.v.bg, x.v.accent, x.v.text].map((c, i) => <i key={i} style={{ background: c }} />)}</span>{x.name}</button>)}</div>
          <h3 className="gh">Colors</h3>
          <div className="g2"><Color label="Accent" value={s.accent} onChange={(v) => set("accent", v)} /><Color label="Second accent" value={s.accent2} onChange={(v) => set("accent2", v)} /><Color label="Text" value={s.text} onChange={(v) => set("text", v)} /><Color label="Surface tint" value={s.glassTint} onChange={(v) => set("glassTint", v)} /></div>
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
          <Field label="Placement"><Seg value={s.socialPos} onChange={(v) => set("socialPos", v)} options={["top", "bottom", "both"] as const} /></Field>
          <Field label="Look"><Seg value={s.socialStyle} onChange={(v) => set("socialStyle", v)} options={[{ v: "chip", l: "Chips" }, { v: "plain", l: "Plain" }]} /></Field>
          <Field label="Default shape"><Seg value={s.iconShape} onChange={(v) => set("iconShape", v)} options={["circle", "rounded", "square"] as const} /></Field>
          <Range label="Size" value={s.socialSize} min={32} max={72} unit="px" onChange={(v) => set("socialSize", v)} />
          <div className="line2"><button type="button" className="btn" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, color: true })))}>Colored logos for all</button><button type="button" className="btn" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, color: false })))}>Normal logos for all</button></div>
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

      {cur && <LinkSheet r={cur} e={errs[cur.key] ?? {}} tried={tried} upd={(p) => upd(cur.key, p)} onClose={() => setLinkKey(null)}
        del={() => { setRows((rs) => rs.filter((r) => r.key !== cur.key)); setLinkKey(null); }} dup={() => dup(cur.key)} pick={() => setPickKey(cur.key)} />}
      {pickKey && <Picker onPick={(p) => choose(pickKey, p)} onClose={() => setPickKey(null)} />}
    </>
  );
}
