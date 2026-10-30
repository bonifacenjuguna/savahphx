"use client";
import { useMemo, useState, useTransition } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BrandIcon, platformIcons } from "@/lib/platform-icons";
import { type Row, type Settings } from "@/lib/theme";
import { logout, saveAll } from "./actions";

function Up({ onUrl, label = "Upload image" }: { onUrl: (u: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="upload-control">
    <label className="btn">{busy ? "Uploading..." : label}
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml" hidden disabled={busy} onChange={async (e) => {
        const input = e.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        setBusy(true); setError("");
        try {
          const blob = await uploadBlob(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          onUrl(blob.url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        } finally {
          setBusy(false);
          input.value = "";
        }
      }} />
    </label>
    {error && <small className="upload-error">{error}</small>}
    <small className="upload-note">PNG, JPG, WebP, GIF, AVIF or SVG · up to 10 MB</small>
  </div>;
}

function IconPicker({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matches = useMemo(() => platformIcons.filter((icon) =>
    icon.title.toLowerCase().includes(query.toLowerCase()) ||
    icon.slug.toLowerCase().includes(query.toLowerCase())
  ), [query]);
  const selected = platformIcons.find((icon) => icon.slug === value);
  return <div className="icon-picker">
    <div className="icon-picker-current">
      <span className="icon-current-mark">{selected ? <BrandIcon slug={value} size={23} /> : <span>＋</span>}</span>
      <span>{selected?.title ?? "No platform logo selected"}</span>
      <button type="button" className="btn" onClick={() => setOpen((v) => !v)}>{open ? "Close logo library" : "Choose platform logo"}</button>
      {value && <button type="button" className="btn" onClick={() => onChange("")}>Clear</button>}
    </div>
    {open && <div className="icon-library">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 50+ platform logos..." />
      <div className="icon-library-grid">
        {matches.map((icon) => <button type="button" key={icon.slug} className={value === icon.slug ? "icon-option selected" : "icon-option"} onClick={() => { onChange(icon.slug); setOpen(false); setQuery(""); }}>
          <BrandIcon slug={icon.slug} size={23} />
          <span>{icon.title}</span>
        </button>)}
        {matches.length === 0 && <p className="hint">No matching logo in the local collection.</p>}
      </div>
      <small className="upload-note">These brand SVGs are bundled with the website. No external icon CDN is needed.</small>
    </div>}
  </div>;
}

function Item({ r, set, del }: { r: Row; set: (p: Partial<Row>) => void; del: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: r.key });
  const pic = r.image;
  return <div ref={setNodeRef} className={expanded ? "row expanded" : "row"} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <div className="row-summary">
      <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder">⠿</button>
      <button type="button" className="row-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
        <span className="thumb">{pic ? <img src={pic} alt="" /> : r.icon ? <BrandIcon slug={r.icon} size={25} /> : <span>＋</span>}</span>
        <span className="row-summary-text"><strong>{r.title.trim() || "Untitled link"}</strong><small>{r.url.trim() || "Add a destination URL"}</small></span>
        {r.shortcut && <span className="shortcut-tag">Shortcut</span>}
        <span className="expand-indicator">{expanded ? "−" : "+"}</span>
      </button>
      <button type="button" className="btn danger" onClick={del}>Delete</button>
    </div>
    {expanded && <div className="row-editor">
      <div className="fields">
        <label>Card title<input placeholder="Title" value={r.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label>Destination URL<input placeholder="https:// destination URL" value={r.url} onChange={(e) => set({ url: e.target.value })} /></label>
        <label className="wide">Platform logo<IconPicker value={r.icon} onChange={(icon) => set({ icon })} /></label>
        <label className="wide">Custom image URL<input placeholder="Optional image URL (overrides platform logo)" value={r.image} onChange={(e) => set({ image: e.target.value })} /></label>
        <div className="wide"><Up onUrl={(u) => set({ image: u })} label="Upload custom icon / image" /></div>
        <div className="line">
          <label className="inline-field">Card width<select value={r.width} onChange={(e) => set({ width: e.target.value as Row["width"] })}><option value="full">Full width</option><option value="half">Half width</option></select></label>
          <label className="chk"><input type="checkbox" checked={r.visible} onChange={(e) => set({ visible: e.target.checked })} />Show this card on profile</label>
          <label className="chk"><input type="checkbox" checked={!!r.shortcut} onChange={(e) => set({ shortcut: e.target.checked })} />Also show its logo as a profile shortcut</label>
        </div>
        <p className="hint wide">Shortcuts are generated only from cards where this option is enabled. They use this card's exact destination URL and selected logo. There are no preset or automatically added social links.</p>
      </div>
    </div>}
  </div>;
}

function List({ rows, setRows }: { rows: Row[]; setRows: (r: Row[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setRows(arrayMove(rows, rows.findIndex((r) => r.key === active.id), rows.findIndex((r) => r.key === over.id)));
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
    <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
      {rows.map((r) => <Item key={r.key} r={r}
        set={(p) => setRows(rows.map((x) => x.key === r.key ? { ...x, ...p } : x))}
        del={() => setRows(rows.filter((x) => x.key !== r.key))} />)}
    </SortableContext>
  </DndContext>;
}

export default function Editor({ initial, initialSettings }: { initial: Row[]; initialSettings: Settings }) {
  const [cards, setCards] = useState(initial.filter((r) => r.kind === "card").map((r) => ({ ...r, shortcut: !!r.shortcut })));
  const [s, setS] = useState(initialSettings);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const mk = (): Row => ({ key: crypto.randomUUID(), kind: "card", title: "", url: "https://", icon: "", image: "", width: "full", visible: true, shortcut: false });
  const save = () => start(async () => {
    try { await saveAll({ rows: cards, settings: s }); setMsg("Saved. Your profile is updated."); }
    catch { setMsg("Save failed. Check link titles, URLs and image addresses."); }
  });

  return <>
    <header className="bar"><h1>Profile Studio</h1><div><a className="btn" href="/" target="_blank">Preview site ↗</a> <form action={logout} style={{ display: "inline" }}><button className="btn">Sign out</button></form></div></header>

    <section>
      <h2>Identity</h2>
      <div className="grid2">
        <label>Display name<input value={s.name} onChange={(e) => up("name", e.target.value)} /></label>
        <label>UID / small subtitle<input value={s.uid} onChange={(e) => up("uid", e.target.value)} /></label>
        <label className="wide">Bio<textarea rows={3} value={s.bio} onChange={(e) => up("bio", e.target.value)} placeholder="Write a short bio. This appears below your name." /></label>
        <label>Profile image URL<input value={s.avatar} onChange={(e) => up("avatar", e.target.value)} placeholder="https://..." /></label>
        <div className="upload-field"><span>Profile image upload</span><Up onUrl={(u) => up("avatar", u)} /></div>
        <label>Banner image URL<input value={s.banner} onChange={(e) => up("banner", e.target.value)} placeholder="https://..." /></label>
        <div className="upload-field"><span>Banner image upload</span><Up onUrl={(u) => up("banner", u)} /></div>
        <label>Whole-page background image URL<input value={s.backgroundImage} onChange={(e) => up("backgroundImage", e.target.value)} placeholder="https://..." /></label>
        <div className="upload-field"><span>Whole-page background upload</span><Up onUrl={(u) => up("backgroundImage", u)} /></div>
      </div>
    </section>

    <section>
      <h2>Profile layout</h2>
      <div className="grid2">
        <label>Profile arrangement<select value={s.profileLayout} onChange={(e) => up("profileLayout", e.target.value as Settings["profileLayout"])}><option value="center">Centered</option><option value="left">Avatar left, text right</option><option value="right">Avatar right, text left</option></select></label>
        <label>Avatar alignment<select value={s.avatarPosition} onChange={(e) => up("avatarPosition", e.target.value as Settings["avatarPosition"])}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
        <label>Profile shortcut placement<select value={s.socialsPosition} onChange={(e) => up("socialsPosition", e.target.value as Settings["socialsPosition"])}><option value="top">Above link cards</option><option value="bottom">Below link cards</option></select></label>
        <label>Profile container<select value={s.headerStyle} onChange={(e) => up("headerStyle", e.target.value as Settings["headerStyle"])}><option value="card">Glass profile card with fade</option><option value="minimal">Minimal / transparent</option></select></label>
      </div>
    </section>

    <section>
      <h2>Appearance</h2>
      <div className="grid2">
        <label>Accent color<input type="color" value={s.accent} onChange={(e) => up("accent", e.target.value)} /></label>
        <label>Base background color<input type="color" value={s.bg} onChange={(e) => up("bg", e.target.value)} /></label>
        <label>Corner radius: {s.radius}px<input type="range" min={0} max={40} value={s.radius} onChange={(e) => up("radius", +e.target.value)} /></label>
        <label>Glass blur: {s.blur}px<input type="range" min={0} max={36} value={s.blur} onChange={(e) => up("blur", +e.target.value)} /></label>
        <label className="chk"><input type="checkbox" checked={s.entrance} onChange={(e) => up("entrance", e.target.checked)} />Entrance animation</label>
        <label className="chk"><input type="checkbox" checked={s.hover} onChange={(e) => up("hover", e.target.checked)} />Hover interactions</label>
      </div>
    </section>

    <section><h2>Link cards</h2><p className="hint">Every card is independent. Expand a card to edit it, choose a bundled platform logo, upload a custom icon, and optionally add its own URL as a profile shortcut. Drag cards to reorder them.</p>
      <List rows={cards} setRows={setCards} /><button className="btn" onClick={() => setCards([...cards, mk()])}>＋ Add link card</button>
    </section>
    <div className="save"><span>{msg}</span><button className="btn pri" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save profile"}</button></div>
  </>;
}
