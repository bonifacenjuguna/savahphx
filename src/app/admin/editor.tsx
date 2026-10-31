"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Page, { CardIcon, Chip, Ico, Mini, Powered } from "@/components/Page";
import { NETS, netById, shortAddr, walletWarn } from "@/lib/crypto";
import { GROUPS, PLATFORMS, byId, resolveUrl, toHandle, type Platform } from "@/lib/platforms";
import { cleanRow } from "@/lib/rows";
import {
  AVATAR_MOTIONS, BG_MOTIONS, BG_TYPES, CONTENT_KEYS, DEMO_LAYOUTS, DENSITIES, ENTRANCES, FONTS, HOVERS, LAYOUTS, PRESETS, RESET_GROUPS, STYLES,
  defaultSettings, emptyRow, normalize, type Layout, type Row, type Settings,
} from "@/lib/theme";
import { logout, saveAll, saveLayouts } from "./actions";
import { StatsSheet, StatsSummary } from "./stats";
import { Color, Field, Gl, ImgField, OptColor, Range, Seg, Sheet, Switch, Tgl, httpsErr } from "./ui";

type Err = { title?: string; link?: string; image?: string; dup?: string };
type Panel = null | "profile" | "header" | "style" | "bg" | "icons" | "motion" | "footer" | "settings" | "stats";
type Sub = null | "reset" | "layouts" | "backup" | "admin";

const blank = (type: Row["type"] = "link"): Row => ({ ...emptyRow(), key: crypto.randomUUID(), type });

function validate(rows: Row[]) {
  const errs: Record<string, Err> = {};
  const seen = new Map<string, string>();
  for (const r of rows) {
    const e: Err = {};
    if (!r.title.trim()) e.title = "Add a title";
    if (r.type === "link") {
      const res = resolveUrl(byId(r.platform), r.handle, r.url);
      if (res.error) e.link = res.error;
      else {
        const k = res.url.toLowerCase();
        if (seen.has(k)) e.dup = `Same link as "${seen.get(k)}"`;
        else seen.set(k, r.title || "Untitled");
      }
      const ie = httpsErr(r.image);
      if (ie) e.image = ie;
    } else if (r.type === "text") {
      if (!r.body.trim()) e.link = "Write the text to show";
    } else {
      if (!r.body.trim()) e.link = "Enter the wallet address";
      else e.dup = walletWarn(netById(r.network), r.body);
    }
    if (e.title || e.link || e.image || e.dup) errs[r.key] = e;
  }
  const hard = Object.values(errs).filter((e) => e.title || e.link || e.image).length;
  return { errs, hard };
}

function Thumb({ r }: { r: Row }) {
  if (r.type === "text") return <span className="th"><Gl n="text" s={20} /></span>;
  if (r.type === "wallet") { const n = netById(r.network); return <span className="th"><span className="nbg" style={{ "--net": n?.color ?? "#8a93a8" } as React.CSSProperties}>{n?.tick ?? "COIN"}</span></span>; }
  return <span className="th"><Ico r={r} ink="ffffff" className="ti" /></span>;
}

function Picker({ title = "Choose a platform", onPick, onClose }: { title?: string; onPick: (p: Platform) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = PLATFORMS.filter((p) => p.label.toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <Sheet title={title} onClose={onClose}>
      <input className="in" placeholder="Search platforms" value={q} onChange={(e) => setQ(e.target.value)} />
      {GROUPS.map((g) => {
        const items = list.filter((p) => p.group === g);
        return items.length ? (
          <section key={g}><h3 className="gh">{g}</h3>
            <div className="pks">{items.map((p) => (
              <button type="button" key={p.id} className="pk" onClick={() => onPick(p)}>
                <span className="th"><Ico r={{ ...emptyRow(), platform: p.id }} ink="ffffff" className="ti" /></span><span>{p.label}</span>
              </button>
            ))}</div>
          </section>
        ) : null;
      })}
      {!list.length && <p className="mut">No match. Use "Custom link" for anything else.</p>}
    </Sheet>
  );
}

function NetPicker({ value, onPick, onClose }: { value: string; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <Sheet title="Choose a network" onClose={onClose}>
      <p className="mut">Pick the exact network. Sending on the wrong one can lose funds.</p>
      {NETS.map((n) => (
        <button type="button" key={n.id} className={"pk wide" + (value === n.id ? " on" : "")} onClick={() => onPick(n.id)}>
          <span className="th"><span className="nbg" style={{ "--net": n.color } as React.CSSProperties}>{n.tick}</span></span><span>{n.name}</span>
        </button>
      ))}
    </Sheet>
  );
}

function LinkSheet({ r, t, e, tried, upd, onClose, del, dup, pick, pickNet }: { r: Row; t: Settings; e: Err; tried: boolean; upd: (p: Partial<Row>) => void; onClose: () => void; del: () => void; dup: () => void; pick: () => void; pickNet: () => void }) {
  const [sure, setSure] = useState(false);
  const p = byId(r.platform);
  const kind = p?.kind ?? "url";
  const res = resolveUrl(p, r.handle, r.url);
  const net = netById(r.network);
  const linkErr = e.link && (tried || r.handle || r.url || r.body) ? e.link : undefined;
  const actions = (
    <div className="acts2">
      <button type="button" className="btn" onClick={dup}>Duplicate</button>
      {sure ? <button type="button" className="btn danger on" onClick={del}>Tap again to delete</button> : <button type="button" className="btn danger" onClick={() => setSure(true)}>Delete</button>}
      <button type="button" className="btn pri" onClick={onClose}>Done</button>
    </div>
  );
  const sizes = (
    <>
      <Field label="Card size" hint="Half cards pair up and thirds group in threes. A leftover one goes full width.">
        <Seg value={r.size} onChange={(v) => upd({ size: v })} options={[{ v: "full", l: "Wide" }, { v: "half", l: "Half" }, { v: "third", l: "Third" }]} />
      </Field>
      <Switch on={r.visible} onChange={(v) => upd({ visible: v })} label="Show on my page" />
    </>
  );

  if (r.type === "text") return (
    <Sheet title={r.title || "Text card"} onClose={onClose}>
      <Field label="Title" error={tried ? e.title : undefined}><input className="in" value={r.title} placeholder="e.g. Business email" onChange={(x) => upd({ title: x.target.value })} /></Field>
      <Field label="Text" error={linkErr} hint={`${r.body.length}/1000. Visitors can copy it with one tap.`}>
        <textarea className="in" rows={5} maxLength={1000} value={r.body} placeholder="An email, a promo code, a short note..." onChange={(x) => upd({ body: x.target.value })} />
      </Field>
      <h3 className="gh">Layout</h3>{sizes}{actions}
    </Sheet>
  );

  if (r.type === "wallet") return (
    <Sheet title={r.title || "Crypto wallet"} onClose={onClose}>
      <button type="button" className="pf" onClick={pickNet}>
        <span className="th"><span className="nbg" style={{ "--net": net?.color ?? "#8a93a8" } as React.CSSProperties}>{net?.tick ?? "COIN"}</span></span>
        <span><b>{net?.name ?? "Choose a network"}</b><small>Tap to change network</small></span>
      </button>
      <Field label="Title" error={tried ? e.title : undefined}><input className="in" value={r.title} placeholder="e.g. Bitcoin donations" onChange={(x) => upd({ title: x.target.value })} /></Field>
      <Field label="Wallet address" error={linkErr}>
        <textarea className="in mono" rows={3} value={r.body} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Paste your address"
          onChange={(x) => upd({ body: x.target.value.replace(/\s/g, "") })} />
      </Field>
      {e.dup && <p className="warn">{e.dup}</p>}
      <Field label={net?.memo ?? "Memo or tag (optional)"} hint="Only for networks that need one, like XRP or TON.">
        <input className="in" value={r.memo} maxLength={80} onChange={(x) => upd({ memo: x.target.value })} />
      </Field>
      <Switch on={r.qr} onChange={(v) => upd({ qr: v })} label="Show QR code" hint="Appears when a visitor opens the wallet" />
      <h3 className="gh">Layout</h3>{sizes}{actions}
    </Sheet>
  );

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
      <Mini t={t}><CardIcon r={r} t={t} /><Chip s={r} t={t} inert /></Mini>
      <Field label="Style"><Seg value={r.color ? "color" : "plain"} onChange={(v) => upd({ color: v === "color" })} options={[{ v: "plain", l: "Normal" }, { v: "color", l: "Colored" }]} /></Field>
      <Field label="Shape"><Seg value={r.shape} onChange={(v) => upd({ shape: v })} options={[{ v: "", l: "Default" }, { v: "circle", l: "Round" }, { v: "rounded", l: "Rounded" }, { v: "square", l: "Square" }]} /></Field>
      {kind === "url" && <Field label="Logo name (optional)" hint="Any brand name, e.g. notion or spotify"><input className="in" value={r.icon} autoCapitalize="none" onChange={(x) => upd({ icon: x.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })} /></Field>}
      <ImgField label="Custom image (replaces the logo)" value={r.image} onChange={(v) => upd({ image: v })} />

      <h3 className="gh">Layout</h3>
      {sizes}
      <Switch on={r.asIcon} onChange={(v) => upd({ asIcon: v })} label="Show in icon row" hint="Adds a shortcut icon under your bio" />
      {actions}
    </Sheet>
  );
}

function Item({ r, err, tried, open }: { r: Row; err?: Err; tried: boolean; open: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.key });
  const p = byId(r.platform);
  const net = netById(r.network);
  const label = r.type === "text" ? "Text card" : r.type === "wallet" ? net?.name ?? "Wallet" : p?.label ?? "Custom link";
  const v = r.type === "text" ? r.body.split("\n")[0] : r.type === "wallet" ? shortAddr(r.body)
    : p && p.kind !== "url" ? (p.kind === "handle" ? `${p.at ? "@" : ""}${toHandle(p, r.handle)}` : r.handle) : r.url.replace(/^https?:\/\//, "");
  const bad = tried && !!(err?.title || err?.link || err?.image);
  return (
    <div ref={setNodeRef} className={"lr" + (bad ? " bad" : "") + (isDragging ? " drag" : "")} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder"><Gl n="grip" s={18} /></button>
      <button type="button" className="lm" onClick={open}>
        <Thumb r={r} />
        <span className="lt"><b>{r.title || "Untitled"}</b><small>{label}{v ? ` · ${v}` : ""}</small></span>
        <span className="tags">
          {bad && <i className="tag red">Fix</i>}
          {r.type === "link" && r.asIcon && <i className="tag">Icon</i>}
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
const FONT_NAMES = { sora: "Sora", inter: "Inter", space: "Space", dm: "DM Sans", playfair: "Serif" } as const;

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
  const [netKey, setNetKey] = useState<string | null>(null);
  const [footPick, setFootPick] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pv, setPv] = useState(false);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, start] = useTransition();
  const [layouts, setLayouts] = useState(initialLayouts);
  const [lname, setLname] = useState("");
  const [rs, setRs] = useState<Record<string, boolean>>({});
  const [replay, setReplay] = useState(0);
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
      if (n.type === "link" && p && p.kind !== "url" && ("handle" in patch || "platform" in patch)) { const x = resolveUrl(p, n.handle, n.url); n.url = x.error ? "" : x.url; }
      return n;
    }));
  const choose = (key: string, p: Platform) => {
    const cur = rows.find((r) => r.key === key);
    if (!cur) return;
    const handle = p.kind === "url" ? "" : cur.handle || (cur.url ? toHandle(p, cur.url.replace(/^(mailto|tel):/, "")) : "");
    upd(key, { platform: p.id, icon: "", title: cur.title || p.label, handle });
    setPickKey(null);
  };
  const addRow = (type: Row["type"]) => {
    const r = blank(type);
    setRows((x) => [...x, r]);
    setAddOpen(false); setLinkKey(r.key);
    if (type === "link") setPickKey(r.key);
  };
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

  const doReset = (ids: string[]) => {
    setS((p) => { const n: Record<string, unknown> = { ...p }; for (const g of RESET_GROUPS) if (ids.includes(g.id)) for (const k of g.keys) n[k] = defaultSettings[k]; return n as Settings; });
    if (ids.includes("links")) setRows([]);
    setRs({}); setSub(null);
    say("Reset done. Save changes to keep it, or Discard to undo.");
  };
  const persist = async (list: Layout[]) => { try { await saveLayouts(list); setLayouts(list); return true; } catch { say("Could not save layouts. Try again."); return false; } };
  const saveLayout = async () => {
    const name = lname.trim();
    if (!name) return say("Give the layout a name first");
    if (layouts.length >= 20) return say("Layout limit reached. Delete one first.");
    const l: Layout = { id: crypto.randomUUID(), name, at: Date.now(), s: { ...s }, rows: rows.map((r) => ({ ...r })) };
    if (await persist([l, ...layouts])) { setLname(""); say(`Saved layout "${name}"`); }
  };
  // Layouts change the look only. Your name, bio, photos and footer text always stay yours.
  const applyLayout = (l: Layout, withLinks: boolean) => {
    setS((p) => normalize({ ...l.s, ...Object.fromEntries(CONTENT_KEYS.map((k) => [k, p[k]])) }));
    if (withLinks && l.rows) setRows(l.rows.map(cleanRow));
    setSub(null);
    say(withLinks ? "Applied the design and links. Save changes to publish." : "Applied the design. Your name, bio and photos were kept. Save changes to publish.");
  };
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
  const iconCount = rows.filter((r) => r.type === "link" && r.asIcon).length;
  const tiles: { id: Exclude<Panel, null | "stats">; name: string; val: string }[] = [
    { id: "profile", name: "Profile", val: s.name || s.title },
    { id: "header", name: "Header", val: s.showHeader ? `${s.header} layout` : "Hidden" },
    { id: "style", name: "Style", val: STYLES.find((x) => x.id === s.style)?.name ?? "" },
    { id: "bg", name: "Background", val: s.bgType },
    { id: "icons", name: "Icon row", val: s.socialPos === "off" ? "Off" : `${iconCount} icon${iconCount === 1 ? "" : "s"} · ${s.socialPos}` },
    { id: "motion", name: "Motion", val: `${s.entrance ? s.entranceStyle : "no entrance"} · ${s.hover ? s.hoverStyle : "no hover"}` },
    { id: "footer", name: "Footer tag", val: s.poweredShow ? `${s.poweredText} ${s.poweredName}` : "Hidden" },
    { id: "settings", name: "Settings", val: `${layouts.length} saved layout${layouts.length === 1 ? "" : "s"}` },
  ];
  const close = () => { setPanel(null); setSub(null); };
  const dots = (v: Partial<Settings>) => <span className="dots3">{[v.bg, v.accent, v.text].map((c, i) => <i key={i} style={{ background: c }} />)}</span>;
  const sample = (i: number, w: "full" | "half") => <div className={`card surf ${w}`} style={{ "--i": i } as React.CSSProperties}><span className="cl"><span className="tt">Sample card</span></span></div>;

  return (
    <div className={"app" + (prefs.compact ? " compact" : "")} style={{ "--ac": prefs.accent } as React.CSSProperties}>
      <header className="top">
        <div><h1>Dashboard</h1><span className={"pill" + (dirty ? " warn" : "")}>{dirty ? "Unsaved changes" : "All changes saved"}</span></div>
        <div className="acts"><a className="btn" href="/" target="_blank">View site</a><form action={logout}><button className="btn">Sign out</button></form></div>
      </header>

      <div className="shell">
        <div className="main">
          <StatsSummary onOpen={() => setPanel("stats")} />
          <section className="panel">
            <div className="ph"><h2>Links</h2><button type="button" className="btn pri" onClick={() => setAddOpen(true)}>Add</button></div>
            <p className="mut">Tap a card to edit it. Drag the handle to reorder.</p>
            <List rows={rows} errs={errs} tried={tried} setRows={setRows} open={setLinkKey} />
            {!rows.length && <p className="mut empty">Nothing here yet. Tap Add to start.</p>}
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

      {panel === "stats" && <StatsSheet onClose={close} say={say} />}

      {panel === "profile" && (
        <Sheet title="Profile" onClose={close}>
          <p className="mut">Empty fields hide on their own, and everything below moves up to fill the space.</p>
          <Switch on={s.showName} onChange={(v) => set("showName", v)} label="Show name" />
          <Field label="Name" hint="Shown above your bio"><input className="in" value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <OptColor label="Name color" value={s.nameColor} auto={s.text} onChange={(v) => set("nameColor", v)} />
          <Switch on={s.showTitle} onChange={(v) => set("showTitle", v)} label="Show bio" />
          <Field label="Bio"><input className="in" value={s.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <OptColor label="Bio color" value={s.titleColor} auto={s.text} onChange={(v) => set("titleColor", v)} />
          <Switch on={s.showBio} onChange={(v) => set("showBio", v)} label="Show extra lines" />
          <Field label="Extra lines" hint="Optional, e.g. UID or location"><textarea className="in" rows={3} value={s.bio} onChange={(e) => set("bio", e.target.value)} /></Field>
          <OptColor label="Extra lines color" value={s.bioColor} auto={s.text} onChange={(v) => set("bioColor", v)} />
          <Switch on={s.showAvatar} onChange={(v) => set("showAvatar", v)} label="Show profile photo" />
          <ImgField label="Profile photo" value={s.avatar} onChange={(v) => set("avatar", v)} />
          <Switch on={s.showBanner} onChange={(v) => set("showBanner", v)} label="Show banner" />
          <ImgField label="Banner image" value={s.banner} onChange={(v) => set("banner", v)} />
          <Field label="Font"><Seg value={s.font} onChange={(v) => set("font", v)} options={FONTS.map((f) => ({ v: f, l: FONT_NAMES[f] }))} /></Field>
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
          <Field label="Spacing" hint="How close everything sits together"><Seg value={s.density} onChange={(v) => set("density", v)} options={DENSITIES} /></Field>
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
              <button type="button" key={x.id} className={"sty" + (s.style === x.id ? " on" : "")} aria-pressed={s.style === x.id} onClick={() => setS((p) => normalize({ ...p, ...x.v, style: x.id }))}>{dots(x.v)}{x.name}</button>
            ))}
          </div>
          <h3 className="gh">Color palettes</h3>
          <div className="stys">
            {PRESETS.map((x) => (
              <button type="button" key={x.name} className={"sty" + (active(x.v) ? " on" : "")} aria-pressed={active(x.v)} onClick={() => setS((p) => normalize({ ...p, ...x.v }))}>{dots(x.v)}{x.name}</button>
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
          <h3 className="gh">Text colors by part</h3>
          <OptColor label="Card text" value={s.cardColor} auto={s.text} onChange={(v) => set("cardColor", v)} />
          <OptColor label="Icon row logos" value={s.iconColor} auto={s.text} onChange={(v) => set("iconColor", v)} />
          <p className="mut">Name, bio and extra lines are in Profile. Footer text is in Footer tag. Auto follows the Text color above.</p>
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
          <Field label="Background motion" hint="Slow movement for gradient and mesh backgrounds"><Seg value={s.bgMotion} onChange={(v) => set("bgMotion", v)} options={BG_MOTIONS} /></Field>
          {s.style === "neu" && <p className="mut">Neumorphism uses a solid base color so the soft shadows work.</p>}
        </Sheet>
      )}

      {panel === "icons" && (
        <Sheet title="Icon row" onClose={close}>
          <Mini t={s}>
            {rows.filter((r) => r.type === "link" && r.asIcon).map((r) => <Chip key={r.key} s={r} t={s} inert />)}
            {!iconCount && <span className="mut">Switch links on below to see them here.</span>}
          </Mini>
          <Field label="Placement"><Seg value={s.socialPos} onChange={(v) => set("socialPos", v)} options={["top", "bottom", "both", "off"] as const} /></Field>
          <Field label="Look"><Seg value={s.socialStyle} onChange={(v) => set("socialStyle", v)} options={[{ v: "chip", l: "Chips" }, { v: "plain", l: "Plain" }]} /></Field>
          <Field label="Default shape"><Seg value={s.iconShape} onChange={(v) => set("iconShape", v)} options={["circle", "rounded", "square"] as const} /></Field>
          <Range label="Size" value={s.socialSize} min={32} max={72} unit="px" onChange={(v) => set("socialSize", v)} />
          <div className="line2"><button type="button" className="btn" onClick={() => setRows((x) => x.map((r) => ({ ...r, color: true })))}>Colored logos for all</button><button type="button" className="btn" onClick={() => setRows((x) => x.map((r) => ({ ...r, color: false })))}>Normal logos for all</button></div>
          <h3 className="gh">Show in icon row</h3>
          {rows.filter((r) => r.type === "link").map((r) => (
            <div className="ir" key={r.key}><Thumb r={r} /><b>{r.title || "Untitled"}</b><Tgl on={r.asIcon} onChange={(v) => upd(r.key, { asIcon: v })} label={r.title} /></div>
          ))}
          {!rows.some((r) => r.type === "link") && <p className="mut">Add links first, then switch them on here.</p>}
        </Sheet>
      )}

      {panel === "motion" && (
        <Sheet title="Motion" onClose={close}>
          <Mini key={replay} t={s} motion>
            <div className="av" />
            {sample(0, "full")}{sample(1, "half")}{sample(2, "half")}
          </Mini>
          <button type="button" className="btn" onClick={() => setReplay((n) => n + 1)}>Replay animation</button>
          <Switch on={s.entrance} onChange={(v) => set("entrance", v)} label="Entrance animation" hint="How cards appear when the page opens" />
          <Field label="Entrance style"><Seg value={s.entranceStyle} onChange={(v) => { set("entranceStyle", v); setReplay((n) => n + 1); }} options={ENTRANCES} /></Field>
          <Switch on={s.hover} onChange={(v) => set("hover", v)} label="Hover and touch effect" hint="How cards react when pointed at" />
          <Field label="Hover style"><Seg value={s.hoverStyle} onChange={(v) => set("hoverStyle", v)} options={HOVERS} /></Field>
          <Field label="Photo motion"><Seg value={s.avatarMotion} onChange={(v) => set("avatarMotion", v)} options={AVATAR_MOTIONS} /></Field>
          <Field label="Background motion"><Seg value={s.bgMotion} onChange={(v) => set("bgMotion", v)} options={BG_MOTIONS} /></Field>
          <Range label="Speed" value={s.speed} min={0.5} max={2} step={0.1} unit="x" onChange={(v) => set("speed", v)} />
          <Range label="Delay between cards" value={s.stagger} min={20} max={200} unit="ms" onChange={(v) => set("stagger", v)} />
          <p className="mut">Visitors who turned on reduced motion on their device never see animations.</p>
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
          <OptColor label="Footer text color" value={s.footerColor} auto={s.text} onChange={(v) => set("footerColor", v)} />
          <h3 className="gh">Logo</h3>
          <button type="button" className="pf" onClick={() => setFootPick(true)}>
            <span className="th">{s.poweredPlatform ? <Ico r={{ ...emptyRow(), platform: s.poweredPlatform }} ink="ffffff" className="ti" /> : <Gl n="style" s={20} />}</span>
            <span><b>{byId(s.poweredPlatform)?.label ?? (s.poweredLogo ? "Your own image" : "Default spark")}</b><small>Choose from the logo library (GitHub, website, ...)</small></span>
          </button>
          <Field label="Logo style"><Seg value={s.poweredColor ? "color" : "plain"} onChange={(v) => set("poweredColor", v === "color")} options={[{ v: "plain", l: "Normal" }, { v: "color", l: "Colored" }]} /></Field>
          <ImgField label="Or upload your own logo" value={s.poweredLogo} onChange={(v) => set("poweredLogo", v)} />
          {(s.poweredPlatform || s.poweredLogo) && <button type="button" className="btn" onClick={() => { set("poweredPlatform", ""); set("poweredLogo", ""); }}>Use the default logo</button>}
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
          <p className="mut">Pick what to reset. Nothing is final until you press Save changes, and Discard undoes it. Your own words and photos are only reset if you switch them on.</p>
          {[...RESET_GROUPS, { id: "links", name: "All links and cards (removes every one)", content: true, keys: [] }].map((g) => (
            <div className="ir" key={g.id}><b>{g.name}{g.content && <i className="tag">Your content</i>}</b><Tgl on={!!rs[g.id]} onChange={(v) => setRs((p) => ({ ...p, [g.id]: v }))} label={g.name} /></div>
          ))}
          <div className="acts2">
            <button type="button" className="btn danger" disabled={!Object.values(rs).some(Boolean)} onClick={() => doReset(Object.keys(rs).filter((k) => rs[k]))}>Reset selected</button>
            <button type="button" className="btn" onClick={() => doReset(RESET_GROUPS.filter((g) => !g.content).map((g) => g.id))}>Reset all design</button>
          </div>
        </Sheet>
      )}

      {sub === "layouts" && (
        <Sheet title="Saved layouts" onClose={() => setSub(null)}>
          <p className="mut">Layouts change the look only. Your name, bio, photos and footer text always stay as they are.</p>
          <Field label="Save the current design" hint="Includes your links too, so you can restore either one.">
            <div className="imgf"><input className="in" value={lname} maxLength={40} placeholder="Name, e.g. Summer look" onChange={(e) => setLname(e.target.value)} /><button type="button" className="btn pri" onClick={saveLayout}>Save</button></div>
          </Field>
          {layouts.length > 0 && <h3 className="gh">Your layouts</h3>}
          {layouts.map((l) => {
            const here = JSON.stringify({ ...normalize(l.s), ...Object.fromEntries(CONTENT_KEYS.map((k) => [k, s[k]])) }) === JSON.stringify(s);
            return (
              <div className={"lay" + (here ? " on" : "")} key={l.id}>
                <div className="lh">{dots(l.s)}<b>{l.name}</b>{here && <i className="tag">Current</i>}</div>
                <div className="line2">
                  <button type="button" className="btn" onClick={() => applyLayout(l, false)}>Apply design</button>
                  {l.rows && <button type="button" className="btn" onClick={() => applyLayout(l, true)}>Apply with links</button>}
                  <button type="button" className="btn danger" onClick={() => persist(layouts.filter((x) => x.id !== l.id)).then((ok) => ok && say("Layout deleted"))}>Delete</button>
                </div>
              </div>
            );
          })}
          <h3 className="gh">Demo layouts</h3>
          {DEMO_LAYOUTS.map((l) => {
            const here = JSON.stringify({ ...normalize(l.s), ...Object.fromEntries(CONTENT_KEYS.map((k) => [k, s[k]])) }) === JSON.stringify(s);
            return (
              <div className={"lay" + (here ? " on" : "")} key={l.id}>
                <div className="lh">{dots(l.s)}<b>{l.name}</b><i className="tag">Demo</i>{here && <i className="tag">Current</i>}</div>
                <div className="line2"><button type="button" className="btn" onClick={() => applyLayout(l, false)}>Apply design</button></div>
              </div>
            );
          })}
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
          <Switch on={prefs.compact} onChange={(v) => setPref({ compact: v })} label="Compact lists" hint="Smaller rows so more fit on screen" />
          <p className="mut">These only change this dashboard on this device. They never affect your public page.</p>
        </Sheet>
      )}

      {addOpen && (
        <Sheet title="Add to your page" onClose={() => setAddOpen(false)}>
          {([
            ["link", "Link", "A social profile, website, email address or phone number"],
            ["text", "Text card", "Copyable text such as an email, a promo code or a short note"],
            ["wallet", "Crypto wallet", "An address with its network, QR code and one-tap copy"],
          ] as [Row["type"], string, string][]).map(([t, n, d]) => (
            <button type="button" key={t} className="ch" onClick={() => addRow(t)}><span className="th"><Gl n={t} s={22} /></span><span><b>{n}</b><small>{d}</small></span><Gl n="chev" /></button>
          ))}
        </Sheet>
      )}

      {cur && <LinkSheet r={cur} t={s} e={errs[cur.key] ?? {}} tried={tried} upd={(p) => upd(cur.key, p)} onClose={() => setLinkKey(null)}
        del={() => { setRows((x) => x.filter((r) => r.key !== cur.key)); setLinkKey(null); }} dup={() => dup(cur.key)}
        pick={() => setPickKey(cur.key)} pickNet={() => setNetKey(cur.key)} />}
      {pickKey && <Picker onPick={(p) => choose(pickKey, p)} onClose={() => setPickKey(null)} />}
      {netKey && <NetPicker value={rows.find((r) => r.key === netKey)?.network ?? ""} onPick={(id) => { upd(netKey, { network: id }); setNetKey(null); }} onClose={() => setNetKey(null)} />}
      {footPick && <Picker title="Choose a footer logo" onPick={(p) => { set("poweredPlatform", p.id); set("poweredLogo", ""); setFootPick(false); }} onClose={() => setFootPick(false)} />}
    </div>
  );
}
