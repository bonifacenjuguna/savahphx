"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cssVars } from "@/components/Page";
import NoteView from "@/components/NoteView";
import { plain } from "@/lib/md";
import { ago, emptyNote, KINDS, kindOf, accentOf, type Note } from "@/lib/notes";
import { BELL_POS, BELL_STYLES, type Settings } from "@/lib/theme";
import { addSamples, deleteNote, noteStats, saveNote } from "./notes-actions";
import { Color, Field, Gl, ImgField, OptColor, Range, Seg, Sheet, Switch } from "./ui";

type Stat = Record<string, { opens: number; clicks: number }>;
const EMOJIS = ["📣", "✨", "🎁", "🔥", "🎉", "❤️", "🚀", "🛍️", "🎵", "📅", "⚠️", "💬", "🙏", "👀", "💎", "🎬"];
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number | null) => { if (!ms) return ""; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocal = (v: string) => { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : null; };
const state = (n: Note, now = Date.now()) => n.status === "draft" ? "Draft" : n.publishAt && n.publishAt > now ? "Scheduled" : n.expiresAt && n.expiresAt <= now ? "Ended" : "Live";

export function counts(notes: Note[]) {
  const now = Date.now();
  return { live: notes.filter((n) => state(n, now) === "Live").length, sched: notes.filter((n) => state(n, now) === "Scheduled").length, draft: notes.filter((n) => n.status === "draft").length };
}

// The card on the dashboard
export function NotifCard({ notes, s, onOpen }: { notes: Note[]; s: Settings; onOpen: (compose: boolean) => void }) {
  const c = counts(notes);
  const recent = notes.slice(0, 3);
  return (
    <section className="panel nsec">
      <div className="ph"><h2>Notifications</h2><button type="button" className="btn pri" onClick={() => onOpen(true)}>New post</button></div>
      <p className="mut">Post updates, images and formatted announcements. Visitors get a bell on your page{s.bellOn ? "" : " (the bell is currently off)"}.</p>
      <div className="nsum">
        <span className="pill ok"><b>{c.live}</b> live</span>
        {c.sched > 0 && <span className="pill"><b>{c.sched}</b> scheduled</span>}
        {c.draft > 0 && <span className="pill"><b>{c.draft}</b> draft{c.draft > 1 ? "s" : ""}</span>}
      </div>
      {recent.map((n) => (
        <button type="button" key={n.key} className="lr nrow" onClick={() => onOpen(false)}>
          <span className="th nem">{n.emoji || kindOf(n.kind).emoji}</span>
          <span className="lt"><b>{n.title || plain(n.body).slice(0, 50) || "Image post"}</b><small>{state(n)} · {ago(n.createdAt)}</small></span>
          {n.pinned && <i className="tag">Pinned</i>}
        </button>
      ))}
      {!notes.length && <p className="mut empty">No posts yet. Tap New post to write your first one.</p>}
      {notes.length > 0 && <button type="button" className="btn nall" onClick={() => onOpen(false)}>Manage all posts and the bell</button>}
    </section>
  );
}

// The full notifications manager
export function NotifSheet({ notes, setNotes, s, set, rows, say, onClose, startCompose }: {
  notes: Note[]; setNotes: (n: Note[]) => void; s: Settings; set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  rows: unknown[]; say: (m: string, ok?: boolean) => void; onClose: () => void; startCompose: boolean;
}) {
  void rows;
  const [tab, setTab] = useState<"posts" | "bell">("posts");
  const [flt, setFlt] = useState<"all" | "Live" | "Scheduled" | "Draft" | "Ended">("all");
  const [edit, setEdit] = useState<Note | null>(startCompose ? emptyNote() : null);
  const [stats, setStats] = useState<Stat>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { noteStats().then(setStats).catch(() => {}); }, []);
  const list = useMemo(() => notes.filter((n) => flt === "all" || state(n) === flt).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt), [notes, flt]);
  const c = counts(notes);

  const samples = async () => {
    setBusy(true);
    try { setNotes(await addSamples()); say("Sample posts added. Edit or delete them any time.", true); } catch (e) { say(e instanceof Error ? e.message : "Could not add samples."); }
    setBusy(false);
  };

  return (
    <>
      <Sheet title="Notifications" onClose={onClose}>
        <Seg value={tab} onChange={setTab} options={[{ v: "posts", l: `Posts (${notes.length})` }, { v: "bell", l: "Bell" }] as const} />
        {tab === "posts" && (
          <>
            <button type="button" className="btn pri nnew" onClick={() => setEdit(emptyNote())}>New post</button>
            <div className="nsum"><span className="pill ok"><b>{c.live}</b> live</span><span className="pill"><b>{c.sched}</b> scheduled</span><span className="pill"><b>{c.draft}</b> drafts</span></div>
            {notes.length > 3 && <Seg value={flt} onChange={setFlt} options={[{ v: "all", l: "All" }, { v: "Live", l: "Live" }, { v: "Scheduled", l: "Soon" }, { v: "Draft", l: "Drafts" }, { v: "Ended", l: "Ended" }] as const} />}
            {list.map((n) => {
              const st = stats[n.key];
              return (
                <button type="button" key={n.key} className="lr nrow" onClick={() => setEdit(n)}>
                  <span className="th nem" style={{ background: accentOf(n) + "33" }}>{n.emoji || kindOf(n.kind).emoji}</span>
                  <span className="lt"><b>{n.title || plain(n.body).slice(0, 60) || "Image post"}</b><small>{state(n)}{n.publishAt && n.publishAt > Date.now() ? ` · ${new Date(n.publishAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ` · ${ago(n.createdAt)}`}{st ? ` · ${st.opens} seen${st.clicks ? ` · ${st.clicks} taps` : ""}` : ""}</small></span>
                  {n.pinned && <i className="tag">Pinned</i>}
                  {n.images.length > 0 && <i className="tag">{n.images.length} img</i>}
                </button>
              );
            })}
            {!list.length && notes.length > 0 && <p className="mut empty">Nothing in this view.</p>}
            {!notes.length && (
              <div className="nempty">
                <Gl n="bell" s={30} />
                <b>Your bell is ready</b>
                <p className="mut">Write a post and it shows up in your visitors' bell right away. Not sure where to start?</p>
                <button type="button" className="btn" disabled={busy} onClick={samples}>{busy ? "Adding..." : "Add 3 sample posts"}</button>
              </div>
            )}
          </>
        )}
        {tab === "bell" && (
          <>
            <p className="mut">Posts go live the moment you publish them. The bell's look is saved with Save changes, like the rest of your design.</p>
            <Switch on={s.bellOn} onChange={(v) => set("bellOn", v)} label="Show the bell" hint="Appears on your page when you have a live post" />
            <Switch on={s.bellAlways} onChange={(v) => set("bellAlways", v)} label="Show it even with no posts" />
            <Field label="Position"><Seg value={s.bellPos} onChange={(v) => set("bellPos", v)} options={BELL_POS.map((p) => ({ v: p, l: p.replace("-", " ") }))} /></Field>
            <Field label="Style" hint="Match cards follows your page style"><Seg value={s.bellStyle} onChange={(v) => set("bellStyle", v)} options={BELL_STYLES.map((p) => ({ v: p, l: p === "auto" ? "Match cards" : p }))} /></Field>
            <Range label="Size" value={s.bellSize} min={34} max={64} unit="px" onChange={(v) => set("bellSize", v)} />
            <OptColor label="Icon color" value={s.bellColor} auto={s.text} onChange={(v) => set("bellColor", v)} />
            {(s.bellStyle === "solid" || s.bellStyle === "outline") && <OptColor label="Bell color" value={s.bellBg} auto={s.accent} onChange={(v) => set("bellBg", v)} />}
            <Field label="Unread badge"><Seg value={s.bellBadge} onChange={(v) => set("bellBadge", v)} options={[{ v: "number", l: "Number" }, { v: "dot", l: "Red dot" }] as const} /></Field>
            <Color label="Badge color" value={s.bellBadgeColor} onChange={(v) => set("bellBadgeColor", v)} />
            <Switch on={s.bellSwing} onChange={(v) => set("bellSwing", v)} label="Ring when something is unread" hint="Swings for a second, rests, then rings again" />
            {s.bellSwing && <Range label="Ring every" value={s.bellEvery} min={4} max={30} unit="s" onChange={(v) => set("bellEvery", v)} />}
            <Field label="Page title"><input className="in" value={s.bellTitle} maxLength={40} onChange={(e) => set("bellTitle", e.target.value)} /></Field>
            <Field label="Empty message"><input className="in" value={s.bellEmpty} maxLength={120} onChange={(e) => set("bellEmpty", e.target.value)} /></Field>
          </>
        )}
      </Sheet>
      {edit && <Composer key={edit.key || "new"} note={edit} s={s} say={say} onClose={() => setEdit(null)}
        onSaved={(list) => { setNotes(list); setEdit(null); noteStats().then(setStats).catch(() => {}); }} all={notes} />}
    </>
  );
}

function Composer({ note, s, say, onClose, onSaved, all }: { note: Note; s: Settings; say: (m: string, ok?: boolean) => void; onClose: () => void; onSaved: (n: Note[]) => void; all: Note[] }) {
  const [n, setN] = useState<Note>(note);
  const isNew = !n.key;
  const [bump, setBump] = useState(!note.key);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const up = (p: Partial<Note>) => setN((x) => ({ ...x, ...p }));
  const kind = kindOf(n.kind);
  const mode = n.status === "draft" ? "draft" : n.publishAt && n.publishAt > Date.now() ? "later" : "now";

  // formatting helpers act on the selected text in the box
  const edit = (f: (sel: string, before: string, after: string) => { text: string; from: number; to: number }) => {
    const el = ta.current; if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd;
    const r = f(n.body.slice(a, b), n.body.slice(0, a), n.body.slice(b));
    up({ body: (n.body.slice(0, a) + r.text + n.body.slice(b)).slice(0, 4000) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + r.from, a + r.to); });
  };
  const wrap = (m: string, ph = "text") => edit((sel) => { const t = sel || ph; return { text: m + t + m, from: m.length, to: m.length + t.length }; });
  const prefix = (p: string, ph = "Your text") => edit((sel, before) => {
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const t = (sel || ph).split("\n").map((l) => p + l).join("\n");
    return { text: lead + t, from: lead.length + p.length, to: lead.length + t.length };
  });
  const link = () => edit((sel) => { const t = sel || "link text"; return { text: `[${t}](https://)`, from: t.length + 3, to: t.length + 11 }; });
  const rule = () => edit((_s, before) => { const t = (before && !before.endsWith("\n") ? "\n" : "") + "\n---\n"; return { text: t, from: t.length, to: t.length }; });
  const emoji = (e: string) => edit(() => ({ text: e, from: e.length, to: e.length }));

  const setImg = (i: number, v: string) => up({ images: n.images.map((x, j) => (j === i ? v : x)) });
  const rmImg = (i: number) => up({ images: n.images.filter((_, j) => j !== i) });
  const cover = (i: number) => up({ images: [n.images[i], ...n.images.filter((_, j) => j !== i)] });

  const save = async (as?: "draft") => {
    const out = as === "draft" ? { ...n, status: "draft" as const } : n;
    if (out.ctaLabel && !/^(https?:\/\/|mailto:|tel:)/i.test(out.ctaUrl)) { say("The button needs a link that starts with https://"); return; }
    if (mode === "later" && !out.publishAt) { say("Pick a date and time to publish."); return; }
    setBusy(true);
    try {
      const saved = await saveNote(out, bump);
      const next = isNew ? [saved, ...all] : all.map((x) => (x.key === saved.key ? saved : x));
      say(saved.status === "draft" ? "Saved as a draft." : mode === "later" ? "Scheduled." : isNew ? "Published. It is on your page now." : "Updated.", true);
      onSaved(next);
    } catch (e) { say(e instanceof Error ? e.message : "Could not save."); }
    setBusy(false);
  };
  const remove = async () => {
    if (!del) { setDel(true); setTimeout(() => setDel(false), 3500); return; }
    setBusy(true);
    try { await deleteNote(n.key); onSaved(all.filter((x) => x.key !== n.key)); say("Post deleted.", true); } catch (e) { say(e instanceof Error ? e.message : "Could not delete."); }
    setBusy(false);
  };
  const dup = () => { setN({ ...n, key: "", title: n.title ? `${n.title} (copy)` : "", status: "draft", publishAt: null, pinned: false }); setBump(true); say("Copied. Edit it and save when ready.", true); };

  const pv: Note = { ...n, key: n.key || "preview", publishAt: n.publishAt && n.publishAt < Date.now() ? n.publishAt : null, createdAt: n.createdAt };
  const title = isNew ? "New post" : "Edit post";

  return (
    <Sheet title={title} onClose={onClose}>
      <Field label="Type">
        <div className="kchips">
          {KINDS.map((k) => (
            <button type="button" key={k.id} className={n.kind === k.id ? "on" : ""} style={{ "--kc": k.color } as React.CSSProperties}
              onClick={() => up({ kind: k.id, emoji: !n.emoji || n.emoji === kind.emoji ? "" : n.emoji })}><i>{k.emoji}</i>{k.name}</button>
          ))}
        </div>
      </Field>
      <Field label="Title" hint={`${n.title.length}/120`}><input className="in" value={n.title} maxLength={120} placeholder="What's new?" onChange={(e) => up({ title: e.target.value })} /></Field>

      <Field label="Message" hint={`${n.body.length}/4000`}>
        <div className="ntb" role="toolbar" aria-label="Formatting">
          <button type="button" title="Bold" onClick={() => wrap("**", "bold")}><b>B</b></button>
          <button type="button" title="Italic" onClick={() => wrap("*", "italic")}><i>I</i></button>
          <button type="button" title="Strikethrough" onClick={() => wrap("~~", "text")}><s>S</s></button>
          <button type="button" title="Highlight" onClick={() => wrap("==", "highlight")}><mark>H</mark></button>
          <button type="button" title="Code" onClick={() => wrap("`", "code")}>{"</>"}</button>
          <span className="sep" />
          <button type="button" title="Big heading" onClick={() => prefix("# ", "Heading")}>H1</button>
          <button type="button" title="Small heading" onClick={() => prefix("## ", "Heading")}>H2</button>
          <button type="button" title="Bullet list" onClick={() => prefix("- ", "Item")}>• List</button>
          <button type="button" title="Numbered list" onClick={() => prefix("1. ", "Step")}>1. List</button>
          <button type="button" title="Checklist" onClick={() => prefix("- [ ] ", "Task")}>☑ Tasks</button>
          <button type="button" title="Quote" onClick={() => prefix("> ", "Quote")}>❝ Quote</button>
          <span className="sep" />
          <button type="button" title="Tip box" onClick={() => prefix("!tip ", "A helpful tip")}>💡 Tip</button>
          <button type="button" title="Info box" onClick={() => prefix("!info ", "Good to know")}>ℹ️ Info</button>
          <button type="button" title="Warning box" onClick={() => prefix("!warn ", "Please note")}>⚠️ Warn</button>
          <button type="button" title="Link" onClick={link}>🔗 Link</button>
          <button type="button" title="Divider" onClick={rule}>— Line</button>
        </div>
        <textarea ref={ta} className="in ntx" rows={9} value={n.body} maxLength={4000} placeholder={"Write your post. Use the toolbar, or type **bold**, *italic*, - lists, > quotes and !tip boxes."} onChange={(e) => up({ body: e.target.value })} />
        <div className="nemo">{EMOJIS.map((e) => <button type="button" key={e} onClick={() => emoji(e)} aria-label={`Insert ${e}`}>{e}</button>)}</div>
      </Field>

      <h3 className="gh">Images</h3>
      <p className="mut">The first image is the big cover. Add up to 6.</p>
      {n.images.map((src, i) => (
        <div key={i} className="nimg">
          <ImgField label={i === 0 ? "Cover image" : `Image ${i + 1}`} value={src} onChange={(v) => (v ? setImg(i, v) : rmImg(i))} />
          {i > 0 && <button type="button" className="btn sm" onClick={() => cover(i)}>Make cover</button>}
        </div>
      ))}
      {n.images.length < 6 && <ImgField key={"add" + n.images.length} label={n.images.length ? "Add another image" : "Add an image"} value="" onChange={(v) => v && up({ images: [...n.images, v] })} />}

      <h3 className="gh">Button</h3>
      <div className="g2">
        <Field label="Button text"><input className="in" value={n.ctaLabel} maxLength={40} placeholder="Open the drop" onChange={(e) => up({ ctaLabel: e.target.value })} /></Field>
        <Field label="Link"><input className="in" value={n.ctaUrl} placeholder="https://" onChange={(e) => up({ ctaUrl: e.target.value })} /></Field>
      </div>

      <h3 className="gh">Look</h3>
      <Field label="Emoji" hint="Shown on the label. Empty uses the type's emoji.">
        <input className="in" value={n.emoji} maxLength={4} placeholder={kind.emoji} onChange={(e) => up({ emoji: e.target.value })} />
      </Field>
      <OptColor label="Accent color" value={n.accent} auto={kind.color} onChange={(v) => up({ accent: v })} />
      <Switch on={n.pinned} onChange={(v) => up({ pinned: v })} label="Pin to the top" />
      <Switch on={n.popup} onChange={(v) => up({ popup: v })} label="Open the bell page for new visitors" hint="Shows once to each visitor, a moment after they arrive" />

      <h3 className="gh">Timing</h3>
      <Field label="Publish">
        <Seg value={mode} onChange={(v) => up(v === "draft" ? { status: "draft", publishAt: null } : v === "now" ? { status: "published", publishAt: null } : { status: "published", publishAt: n.publishAt && n.publishAt > Date.now() ? n.publishAt : Date.now() + 3600e3 })}
          options={[{ v: "now", l: "Now" }, { v: "later", l: "Schedule" }, { v: "draft", l: "Draft" }] as const} />
      </Field>
      {mode === "later" && <Field label="Goes live at" hint="Hidden until this time"><input className="in" type="datetime-local" value={toLocal(n.publishAt)} onChange={(e) => up({ publishAt: fromLocal(e.target.value) })} /></Field>}
      <Switch on={!!n.expiresAt} onChange={(v) => up({ expiresAt: v ? Math.max(Date.now(), n.publishAt ?? 0) + 7 * 86400e3 : null })} label="Remove automatically" />
      {!!n.expiresAt && <Field label="Disappears at"><input className="in" type="datetime-local" value={toLocal(n.expiresAt)} onChange={(e) => up({ expiresAt: fromLocal(e.target.value) })} /></Field>}
      {!isNew && <Switch on={bump} onChange={setBump} label="Show as new again" hint="Visitors who already read it get the red dot again" />}
      {mode === "later" && <p className="mut">Scheduled posts stay hidden on your page until the time arrives.</p>}

      <h3 className="gh">Preview</h3>
      <div className="pg emb nprev" data-style={s.style} data-font={s.font} data-bgi="off" style={cssVars(s)}>
        <NoteView n={pv} unread open />
      </div>

      <div className="nsave">
        <button type="button" className="btn pri" disabled={busy} onClick={() => save()}>{busy ? "Saving..." : mode === "draft" ? "Save draft" : mode === "later" ? "Schedule post" : isNew ? "Publish" : "Save changes"}</button>
        {mode !== "draft" && <button type="button" className="btn" disabled={busy} onClick={() => save("draft")}>Save as draft</button>}
        {!isNew && <button type="button" className="btn" disabled={busy} onClick={dup}>Duplicate</button>}
        {!isNew && <button type="button" className={"btn danger" + (del ? " arm" : "")} disabled={busy} onClick={remove}>{del ? "Tap again to delete" : "Delete post"}</button>}
      </div>
    </Sheet>
  );
}
