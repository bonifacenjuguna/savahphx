"use client";
import { useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { logoUrl, type Row, type Settings } from "@/lib/theme";
import { logout, saveAll, upload } from "./actions";

const SLUGS = ["instagram","whatsapp","tiktok","youtube","threads","facebook","x","github","telegram","discord","snapchat","twitch","spotify","gmail","patreon","paypal","kick"];

function Up({ onUrl, label = "Upload image" }: { onUrl: (u: string) => void; label?: string }) {
  return <label className="btn">{label}<input type="file" accept="image/*" hidden onChange={async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    try { onUrl(await upload(fd)); } catch { alert("Upload failed (images up to 4 MB)."); }
    e.currentTarget.value = "";
  }} /></label>;
}

function Item({ r, set, del }: { r: Row; set: (p: Partial<Row>) => void; del: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: r.key });
  const pic = r.image || (r.icon ? logoUrl(r.icon) : "");
  return <div ref={setNodeRef} className="row" style={{ transform: CSS.Transform.toString(transform), transition }}>
    <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder">⠿</button>
    {pic ? <img className="thumb" src={pic} alt="" /> : <span className="thumb" />}
    <div className="fields">
      <input placeholder="Title" value={r.title} onChange={(e) => set({ title: e.target.value })} />
      <input placeholder="https:// destination URL" value={r.url} onChange={(e) => set({ url: e.target.value })} />
      <input list="slugs" placeholder="Icon slug (e.g. instagram)" value={r.icon} onChange={(e) => set({ icon: e.target.value.toLowerCase() })} />
      <input placeholder="Custom image URL (overrides icon)" value={r.image} onChange={(e) => set({ image: e.target.value })} />
      <div className="line">
        <Up onUrl={(u) => set({ image: u })} label="Upload icon" />
        {r.kind === "card" && <select value={r.width} onChange={(e) => set({ width: e.target.value as Row["width"] })}><option value="full">Full width</option><option value="half">Half width</option></select>}
        <label className="chk"><input type="checkbox" checked={r.visible} onChange={(e) => set({ visible: e.target.checked })} />Visible</label>
        <button type="button" className="btn danger" onClick={del}>Delete</button>
      </div>
    </div>
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
  const [cards, setCards] = useState(initial.filter((r) => r.kind === "card"));
  const [socials, setSocials] = useState(initial.filter((r) => r.kind === "social"));
  const [s, setS] = useState(initialSettings);
  const [msg, setMsg] = useState("");
  const [busy, start] = useTransition();
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const mk = (kind: Row["kind"]): Row => ({ key: crypto.randomUUID(), kind, title: "", url: "https://", icon: "", image: "", width: "full", visible: true });
  const save = () => start(async () => {
    try { await saveAll({ rows: [...cards, ...socials], settings: s }); setMsg("Saved. Your profile is updated."); }
    catch { setMsg("Save failed. Check required link titles and URLs."); }
  });

  return <>
    <datalist id="slugs">{SLUGS.map((x) => <option key={x} value={x} />)}</datalist>
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
        <label>Social shortcuts placement<select value={s.socialsPosition} onChange={(e) => up("socialsPosition", e.target.value as Settings["socialsPosition"])}><option value="top">Inside profile / top</option><option value="bottom">Below profile / bottom</option></select></label>
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

    <section><h2>Social shortcuts</h2><p className="hint">These icons are real links. Their destination comes from each shortcut URL and their icon is also used on its matching card when configured separately.</p>
      <List rows={socials} setRows={setSocials} /><button className="btn" onClick={() => setSocials([...socials, mk("social")])}>＋ Add social shortcut</button>
    </section>
    <section><h2>Link cards</h2><p className="hint">Each card opens its URL. Choose a brand icon or upload a custom image; drag rows to change their order.</p>
      <List rows={cards} setRows={setCards} /><button className="btn" onClick={() => setCards([...cards, mk("card")])}>＋ Add link card</button>
    </section>
    <div className="save"><span>{msg}</span><button className="btn pri" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save profile"}</button></div>
  </>;
}
