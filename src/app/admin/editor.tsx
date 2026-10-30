"use client";
import { useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Page from "@/components/Page";
import { BG_TYPES, FONTS, LAYOUTS, PRESETS, logoUrl, normalize, type Row, type Settings } from "@/lib/theme";
import { logout, saveAll, upload } from "./actions";

const SLUGS = ["instagram","whatsapp","tiktok","youtube","threads","facebook","x","github","telegram","discord","snapchat","twitch","spotify","gmail","patreon","paypal","kick"];
type K = keyof Settings;

function Up({ onUrl }: { onUrl: (u: string) => void }) {
  return (
    <label className="btn">
      Upload
      <input type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const fd = new FormData();
        fd.append("file", f);
        try { onUrl(await upload(fd)); } catch { alert("Upload failed (images up to 4 MB)."); }
      }} />
    </label>
  );
}

function Item({ r, cards, set, del }: { r: Row; cards: Row[]; set: (p: Partial<Row>) => void; del: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: r.key });
  const target = cards.find((c) => c.key === r.shortcutOf);
  const slug = r.icon || target?.icon || "";
  const pic = r.image || target?.image || (slug ? logoUrl(slug, "ffffff") : "");
  return (
    <div ref={setNodeRef} className="row" style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>
      </button>
      {pic ? <img className="thumb" src={pic} alt="" /> : <span className="thumb" />}
      <div className="fields">
        {r.kind === "social" && (
          <select className="wide" value={r.shortcutOf} onChange={(e) => set({ shortcutOf: e.target.value })}>
            <option value="">Own link (not a shortcut)</option>
            {cards.map((c) => <option key={c.key} value={c.key}>Shortcut to: {c.title || "(untitled card)"}</option>)}
          </select>
        )}
        <input placeholder={target ? `Title (synced: ${target.title})` : "Title"} value={r.title} onChange={(e) => set({ title: e.target.value })} />
        {!target && <input placeholder="https://..." value={r.url} onChange={(e) => set({ url: e.target.value })} />}
        <input list="slugs" placeholder="Logo name (e.g. instagram)" value={r.icon} onChange={(e) => set({ icon: e.target.value.toLowerCase() })} />
        <input placeholder="Or custom image URL" value={r.image} onChange={(e) => set({ image: e.target.value })} />
        <div className="line">
          <Up onUrl={(u) => set({ image: u })} />
          {r.kind === "card" && (
            <select value={r.width} onChange={(e) => set({ width: e.target.value as Row["width"] })}>
              <option value="full">Wide</option>
              <option value="half">Half</option>
            </select>
          )}
          <label className="chk"><input type="checkbox" checked={r.visible} onChange={(e) => set({ visible: e.target.checked })} />Visible</label>
          <button type="button" className="btn danger" onClick={del}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function List({ rows, cards, setRows }: { rows: Row[]; cards: Row[]; setRows: (r: Row[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setRows(arrayMove(rows, rows.findIndex((r) => r.key === active.id), rows.findIndex((r) => r.key === over.id)));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
        {rows.map((r) => (
          <Item key={r.key} r={r} cards={cards}
            set={(p) => setRows(rows.map((x) => (x.key === r.key ? { ...x, ...p } : x)))}
            del={() => setRows(rows.filter((x) => x.key !== r.key))} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="f"><span>{label}</span>{children}</label>
);

export default function Editor({ initial, initialSettings }: { initial: Row[]; initialSettings: Settings }) {
  const [cards, setCards] = useState(initial.filter((r) => r.kind === "card"));
  const [socials, setSocials] = useState(initial.filter((r) => r.kind === "social"));
  const [s, setS] = useState(initialSettings);
  const [msg, setMsg] = useState("");
  const [pv, setPv] = useState(false);
  const [busy, start] = useTransition();
  const up = (k: K, v: unknown) => setS((p) => ({ ...p, [k]: v }) as Settings);
  const mk = (kind: Row["kind"]): Row => ({ key: crypto.randomUUID(), kind, title: "", url: "https://", icon: "", image: "", width: "full", visible: true, shortcutOf: "" });

  const txt = (k: K, label: string) => <Field label={label}><input value={s[k] as string} onChange={(e) => up(k, e.target.value)} /></Field>;
  const sel = (k: K, label: string, opts: readonly string[]) => <Field label={label}><select value={s[k] as string} onChange={(e) => up(k, e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select></Field>;
  const rng = (k: K, label: string, lo: number, hi: number, u = "") => <Field label={`${label}: ${s[k]}${u}`}><input type="range" min={lo} max={hi} value={s[k] as number} onChange={(e) => up(k, +e.target.value)} /></Field>;
  const col = (k: K, label: string) => <Field label={label}><input type="color" value={s[k] as string} onChange={(e) => up(k, e.target.value)} /></Field>;
  const chk = (k: K, label: string) => <label className="chk"><input type="checkbox" checked={s[k] as boolean} onChange={(e) => up(k, e.target.checked)} />{label}</label>;
  const pic = (k: K, label: string) => <Field label={label}><div className="line"><input value={s[k] as string} placeholder="https://..." onChange={(e) => up(k, e.target.value)} /><Up onUrl={(u) => up(k, u)} /></div></Field>;

  const save = () => start(async () => {
    try { await saveAll({ rows: [...cards, ...socials], settings: s }); setMsg("Saved. Your site is updated."); }
    catch { setMsg("Save failed. Every link needs a title and a URL starting with https://"); }
  });

  return (
    <>
      <datalist id="slugs">{SLUGS.map((x) => <option key={x} value={x} />)}</datalist>
      <header className="bar">
        <h1>Admin</h1>
        <div><a className="btn" href="/" target="_blank">View site</a> <form action={logout} style={{ display: "inline" }}><button className="btn">Sign out</button></form></div>
      </header>

      <div className="shell">
        <div className="col">
          <details open><summary>Presets</summary>
            <div className="line">{PRESETS.map((p) => <button key={p.name} className="btn" onClick={() => setS(normalize({ ...s, ...p.v }))}>{p.name}</button>)}</div>
          </details>

          <details open><summary>Profile and header</summary>
            <div className="grid2">
              {sel("header", "Header layout", LAYOUTS)}
              {sel("align", "Text alignment", ["left", "center", "right"])}
              {txt("title", "Bio title")}
              <Field label="Bio text (multiple lines)"><textarea rows={3} value={s.bio} onChange={(e) => up("bio", e.target.value)} /></Field>
              {pic("avatar", "Profile photo")}
              {pic("banner", "Banner image (banner, side, card, hero)")}
              {sel("avatarShape", "Photo shape", ["circle", "rounded", "square"])}
              {sel("avatarPos", "Photo position (or side)", ["left", "center", "right"])}
              {rng("avatarSize", "Photo size", 64, 200, "px")}
              {rng("titleSize", "Title size", 14, 56, "px")}
              {rng("bioSize", "Bio size", 11, 24, "px")}
              {sel("font", "Font", FONTS)}
              {chk("avatarGlow", "Photo glow")}
              {chk("upper", "Uppercase title")}
            </div>
          </details>

          <details open><summary>Social icons (shortcuts)</summary>
            <div className="grid2">
              {sel("socialPos", "Placement", ["top", "bottom", "both"])}
              {sel("socialStyle", "Style", ["glass", "plain", "brand"])}
              {rng("socialSize", "Size", 32, 72, "px")}
            </div>
            <List rows={socials} cards={cards} setRows={setSocials} />
            <button className="btn" onClick={() => setSocials([...socials, mk("social")])}>+ Add icon</button>
          </details>

          <details open><summary>Cards</summary>
            <List rows={cards} cards={cards} setRows={setCards} />
            <button className="btn" onClick={() => setCards([...cards, mk("card")])}>+ Add card</button>
          </details>

          <details open><summary>Background</summary>
            <div className="grid2">
              {sel("bgType", "Type", BG_TYPES)}
              {col("bg", "Base color")}
              {col("bg2", "Second color")}
              {pic("bgImage", "Background image")}
              {rng("bgDim", "Image dim", 0, 90, "%")}
              {rng("bgBlur", "Image blur", 0, 30, "px")}
            </div>
          </details>

          <details open><summary>Glass and colors</summary>
            <div className="grid2">
              {col("accent", "Accent")}
              {col("text", "Text")}
              {col("glassTint", "Glass tint")}
              {rng("glassBlur", "Glass blur", 0, 40, "px")}
              {rng("glassOpacity", "Glass opacity", 0, 80, "%")}
              {rng("glassBorder", "Glass edge", 0, 60, "%")}
              {rng("radius", "Corner radius", 0, 40, "px")}
              {chk("entrance", "Entrance animation")}
              {chk("hover", "Hover animation")}
            </div>
          </details>
        </div>

        <aside className={`pv${pv ? " show" : ""}`}>
          <button className="btn closepv" onClick={() => setPv(false)}>Close preview</button>
          <div className="phone"><Page rows={[...cards, ...socials]} t={s} embedded /></div>
        </aside>
      </div>

      <div className="save">
        <span>{msg}</span>
        <div>
          <button className="btn onlym" onClick={() => setPv(true)}>Preview</button>{" "}
          <button className="btn pri" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
        </div>
      </div>
    </>
  );
}
