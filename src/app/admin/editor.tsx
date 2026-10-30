"use client";
import { useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { logoUrl, type Row, type Settings } from "@/lib/theme";
import { logout, saveAll, upload } from "./actions";

const SLUGS = ["instagram","whatsapp","tiktok","youtube","threads","facebook","x","github","telegram","discord","snapchat","twitch","spotify","gmail","patreon","paypal","kick"];

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

function Item({ r, set, del }: { r: Row; set: (p: Partial<Row>) => void; del: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: r.key });
  const pic = r.image || (r.icon ? logoUrl(r.icon) : "");
  return (
    <div ref={setNodeRef} className="row" style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button type="button" className="grip" style={{ touchAction: "none" }} {...attributes} {...listeners} aria-label="Drag to reorder">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>
      </button>
      {pic ? <img className="thumb" src={pic} alt="" /> : <span className="thumb" />}
      <div className="fields">
        <input placeholder="Title" value={r.title} onChange={(e) => set({ title: e.target.value })} />
        <input placeholder="https://..." value={r.url} onChange={(e) => set({ url: e.target.value })} />
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

function List({ rows, setRows }: { rows: Row[]; setRows: (r: Row[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setRows(arrayMove(rows, rows.findIndex((r) => r.key === active.id), rows.findIndex((r) => r.key === over.id)));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
        {rows.map((r) => (
          <Item key={r.key} r={r}
            set={(p) => setRows(rows.map((x) => (x.key === r.key ? { ...x, ...p } : x)))}
            del={() => setRows(rows.filter((x) => x.key !== r.key))} />
        ))}
      </SortableContext>
    </DndContext>
  );
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

      <section>
        <h2>Profile and theme</h2>
        <div className="grid2">
          <label>Name<input value={s.name} onChange={(e) => up("name", e.target.value)} /></label>
          <label>UID / tagline<input value={s.uid} onChange={(e) => up("uid", e.target.value)} /></label>
          <label>Avatar URL<input value={s.avatar} onChange={(e) => up("avatar", e.target.value)} /></label>
          <label>Avatar upload<Up onUrl={(u) => up("avatar", u)} /></label>
          <label>Accent<input type="color" value={s.accent} onChange={(e) => up("accent", e.target.value)} /></label>
          <label>Background<input type="color" value={s.bg} onChange={(e) => up("bg", e.target.value)} /></label>
          <label>Corner radius: {s.radius}px<input type="range" min={0} max={40} value={s.radius} onChange={(e) => up("radius", +e.target.value)} /></label>
          <label>Glass blur: {s.blur}px<input type="range" min={0} max={30} value={s.blur} onChange={(e) => up("blur", +e.target.value)} /></label>
          <label className="chk"><input type="checkbox" checked={s.entrance} onChange={(e) => up("entrance", e.target.checked)} />Entrance animation</label>
          <label className="chk"><input type="checkbox" checked={s.hover} onChange={(e) => up("hover", e.target.checked)} />Hover animation</label>
        </div>
      </section>

      <section>
        <h2>Social icons</h2>
        <List rows={socials} setRows={setSocials} />
        <button className="btn" onClick={() => setSocials([...socials, mk("social")])}>+ Add icon</button>
      </section>

      <section>
        <h2>Cards</h2>
        <List rows={cards} setRows={setCards} />
        <button className="btn" onClick={() => setCards([...cards, mk("card")])}>+ Add card</button>
      </section>

      <div className="save">
        <span>{msg}</span>
        <button className="btn pri" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save changes"}</button>
      </div>
    </>
  );
}
