"use client";
import { useEffect, useRef, useState } from "react";
import NotifBody, { Glyph, inline } from "@/components/NotifBody";
import { Mini } from "@/components/Page";
import {
  KINDS, LIMITS, TEMPLATES, TONES, ago, cleanBlocks, emptyNotif, kindOf, safeHref, sortN, stamp, stateOf, tintOf,
  type Block, type KindId, type NState, type Notif, type Tone,
} from "@/lib/notifs";
import type { Settings } from "@/lib/theme";
import { Field, Gl, ImgField, OptColor, Seg, Sheet, Switch, httpsErr } from "./ui";
import { deleteNotif, notifStats, renotify, saveNotif, type NStat } from "./notif-actions";

type Say = (m: string, ok?: boolean) => void;
const rid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);
const STATE_LABEL: Record<NState, string> = { live: "Live", scheduled: "Scheduled", draft: "Draft", expired: "Ended" };
const pad = (x: number) => String(x).padStart(2, "0");
const toLocal = (ms: number | null) => { if (!ms) return ""; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocal = (v: string) => { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : null; };
const when = (ms: number) => new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const upsert = (list: Notif[], n: Notif) => [...list.filter((x) => x.key !== n.key), n].sort(sortN);

/* ---------- the card on the dashboard ---------- */
export function NotifSummary({ items, onOpen }: { items: Notif[]; onOpen: () => void }) {
  const [st, setSt] = useState<Record<string, NStat> | null>(null);
  useEffect(() => { notifStats().then(setSt).catch(() => setSt(null)); }, []);
  const now = Date.now();
  const c = { live: 0, scheduled: 0, draft: 0 };
  for (const n of items) { const s = stateOf(n, now); if (s in c) c[s as keyof typeof c]++; }
  const opens = st ? Object.values(st).reduce((a, x) => a + x.opens, 0) : null;
  const clicks = st ? Object.values(st).reduce((a, x) => a + x.clicks, 0) : null;
  const latest = items.slice(0, 3);
  return (
    <button type="button" className="panel stc nmc" onClick={onOpen}>
      <div className="ph"><h2><Gl n="bell" s={18} /> Notifications</h2><span className="lv">{c.live ? <><i className="dot" />{c.live} live</> : "Nothing live"}</span></div>
      <div className="kpis">
        <div className="kpi"><b>{c.live}</b><small>Live</small></div>
        <div className="kpi"><b>{c.scheduled}</b><small>Scheduled</small></div>
        <div className="kpi"><b>{c.draft}</b><small>Drafts</small></div>
      </div>
      {latest.length ? (
        <div className="nm-mini">
          {latest.map((n) => {
            const s = stateOf(n, now);
            return <div key={n.key} className="nm-mr" style={{ "--kc": tintOf(n) } as React.CSSProperties}><i className="nm-kd"><Glyph k={n.kind} s={14} /></i><b>{n.title}</b><em className={`nm-st ${s}`}>{STATE_LABEL[s]}</em></div>;
          })}
        </div>
      ) : <p className="mut">Post news, offers and updates. Visitors get a ringing bell on your page.</p>}
      {opens !== null && <p className="nm-eng"><Gl n="eye" s={14} /> {opens} {opens === 1 ? "person has" : "people have"} opened your posts{clicks ? ` · ${clicks} button taps` : ""}</p>}
      <span className="more">Write and manage <Gl n="chev" s={16} /></span>
    </button>
  );
}

/* ---------- list + manager ---------- */
const FILTERS: { v: "all" | NState; l: string }[] = [{ v: "all", l: "All" }, { v: "live", l: "Live" }, { v: "scheduled", l: "Scheduled" }, { v: "draft", l: "Drafts" }, { v: "expired", l: "Ended" }];

export function NotifSheet({ items, setItems, t, onClose, say, openBell }: { items: Notif[]; setItems: (f: (p: Notif[]) => Notif[]) => void; t: Settings; onClose: () => void; say: Say; openBell: () => void }) {
  const [filter, setFilter] = useState<"all" | NState>("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ n: Notif; isNew: boolean } | null>(null);
  const [stats, setStats] = useState<Record<string, NStat>>({});
  useEffect(() => { notifStats().then(setStats).catch(() => {}); }, []);

  const now = Date.now();
  const shown = items.filter((n) => (filter === "all" || stateOf(n, now) === filter) && (!q.trim() || `${n.title} ${n.summary}`.toLowerCase().includes(q.toLowerCase().trim())));
  const count = (v: "all" | NState) => (v === "all" ? items.length : items.filter((n) => stateOf(n, now) === v).length);

  return (
    <>
      <Sheet title="Notifications" onClose={onClose}>
        <p className="mut">Posts go live the moment you publish them. They do not wait for Save changes. Visitors see a bell on your page that rings while something is new.</p>
        <div className="line2">
          <button type="button" className="btn pri" onClick={() => setEdit({ n: emptyNotif(), isNew: true })}><Gl n="plus" s={18} /> New notification</button>
          <button type="button" className="btn" onClick={openBell}><Gl n="bell" s={18} /> Bell look</button>
        </div>

        {items.length > 0 && <>
          <div className="nm-fl"><Seg value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ v: f.v, l: `${f.l} ${count(f.v)}` }))} /></div>
          <input className="in" placeholder="Search your posts" value={q} onChange={(e) => setQ(e.target.value)} />
        </>}

        {shown.map((n) => {
          const s = stateOf(n, now), x = stats[n.key];
          return (
            <button type="button" key={n.key} className="nm-row" style={{ "--kc": tintOf(n) } as React.CSSProperties} onClick={() => setEdit({ n, isNew: false })}>
              <span className="nm-th">{n.image ? <img src={n.image} alt="" /> : <Glyph k={n.kind} s={22} />}</span>
              <span className="nm-tx">
                <b>{n.title}</b>
                <small>{kindOf(n.kind).name} · {s === "scheduled" ? `goes live ${when(n.publishAt!)}` : s === "draft" ? `edited ${ago(n.updatedAt)}` : s === "expired" ? `ended ${ago(n.expiresAt!)}` : ago(stamp(n))}</small>
                {s !== "draft" && s !== "scheduled" && <small className="nm-sx"><Gl n="eye" s={12} /> {x?.opens ?? 0} opened{x?.clicks ? ` · ${x.clicks} taps` : ""}</small>}
              </span>
              <span className="tags">
                {n.pinned && <i className="tag"><Gl n="pin" s={11} /></i>}
                {n.quiet && <i className="tag">Quiet</i>}
                <i className={`tag nm-st ${s}`}>{STATE_LABEL[s]}</i>
              </span>
            </button>
          );
        })}
        {items.length > 0 && !shown.length && <p className="mut empty">Nothing matches.</p>}

        {!items.length && (
          <>
            <p className="mut empty">No notifications yet. Start from a template or write your own.</p>
            <div className="nm-tpls">
              {TEMPLATES.map((tp) => (
                <button type="button" key={tp.id} className="nm-tp" onClick={() => setEdit({ n: { ...emptyNotif(), ...tp.make() }, isNew: true })}>
                  <i style={{ "--kc": kindOf(tp.make().kind ?? "info").color } as React.CSSProperties}><Glyph k={tp.make().kind ?? "info"} s={18} /></i>
                  <span><b>{tp.name}</b><small>{tp.note}</small></span>
                </button>
              ))}
            </div>
          </>
        )}
      </Sheet>

      {edit && (
        <Composer key={edit.n.key} n0={edit.n} isNew={edit.isNew} t={t} stat={stats[edit.n.key]} say={say}
          onClose={() => setEdit(null)}
          onSaved={(n) => setItems((p) => upsert(p, n))}
          onDeleted={(k) => { setItems((p) => p.filter((x) => x.key !== k)); setEdit(null); }}
          onDuplicate={(copy) => setEdit({ n: copy, isNew: true })} />
      )}
    </>
  );
}

/* ---------- text with a small formatting toolbar ---------- */
function Fmt({ value, onChange, rows = 4, max = LIMITS.text, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; max?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const put = (build: (sel: string) => string, ph: string) => {
    const el = ref.current;
    const a = el?.selectionStart ?? value.length, b = el?.selectionEnd ?? value.length;
    const sel = value.slice(a, b) || ph;
    const ins = build(sel);
    onChange((value.slice(0, a) + ins + value.slice(b)).slice(0, max));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a, a + ins.length); });
  };
  const link = () => {
    const u = window.prompt("Link address (https://..., mailto: or tel:)", "https://");
    const href = u ? safeHref(u) : "";
    if (!href) { if (u) window.alert("Use a link that starts with https://, mailto: or tel:"); return; }
    put((s) => `[${s}](${href})`, "link text");
  };
  return (
    <div className="fmt">
      <div className="fmt-b" role="toolbar" aria-label="Formatting">
        <button type="button" aria-label="Bold" title="Bold" onClick={() => put((s) => `**${s}**`, "bold")}><Gl n="bold" s={16} /></button>
        <button type="button" aria-label="Italic" title="Italic" onClick={() => put((s) => `*${s}*`, "italic")}><Gl n="italic" s={16} /></button>
        <button type="button" aria-label="Strikethrough" title="Strikethrough" onClick={() => put((s) => `~~${s}~~`, "text")}><Gl n="strike" s={16} /></button>
        <button type="button" aria-label="Code" title="Code" onClick={() => put((s) => `\`${s}\``, "code")}><Gl n="code" s={16} /></button>
        <button type="button" aria-label="Link" title="Link" onClick={link}><Gl n="link" s={16} /></button>
        <span className="sp" /><small>{value.length}/{max}</small>
      </div>
      <textarea ref={ref} className="in" rows={rows} maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ---------- blocks ---------- */
const BLOCKS: { t: Block["t"]; name: string; glyph: string; make: () => Block }[] = [
  { t: "h", name: "Heading", glyph: "heading", make: () => ({ id: rid(), t: "h", text: "" }) },
  { t: "p", name: "Text", glyph: "text", make: () => ({ id: rid(), t: "p", text: "" }) },
  { t: "img", name: "Picture", glyph: "image", make: () => ({ id: rid(), t: "img", url: "", caption: "" }) },
  { t: "gallery", name: "Gallery", glyph: "gallery", make: () => ({ id: rid(), t: "gallery", urls: ["", ""] }) },
  { t: "ul", name: "Bullets", glyph: "list", make: () => ({ id: rid(), t: "ul", items: ["", ""] }) },
  { t: "ol", name: "Numbered", glyph: "olist", make: () => ({ id: rid(), t: "ol", items: ["", ""] }) },
  { t: "quote", name: "Quote", glyph: "quote", make: () => ({ id: rid(), t: "quote", text: "", by: "" }) },
  { t: "callout", name: "Callout", glyph: "callout", make: () => ({ id: rid(), t: "callout", tone: "info", text: "" }) },
  { t: "btn", name: "Button", glyph: "button", make: () => ({ id: rid(), t: "btn", label: "", url: "", look: "solid" }) },
  { t: "code", name: "Copy box", glyph: "code", make: () => ({ id: rid(), t: "code", text: "", label: "" }) },
  { t: "kv", name: "Details", glyph: "kv", make: () => ({ id: rid(), t: "kv", rows: [{ k: "", v: "" }, { k: "", v: "" }] }) },
  { t: "hr", name: "Divider", glyph: "hr", make: () => ({ id: rid(), t: "hr" }) },
];
const meta = (t: Block["t"]) => BLOCKS.find((b) => b.t === t)!;
const TONE_NAMES: Record<Tone, string> = { info: "Info", success: "Good news", warning: "Careful", danger: "Important" };

type Errs = { title?: string; cta?: string; time?: string; blocks: Record<string, string> };
function check(n: Notif, now: number): Errs {
  const e: Errs = { blocks: {} };
  if (!n.title.trim()) e.title = "Add a title";
  const link = n.ctaUrl.trim();
  if (n.cta.trim() && !link) e.cta = "Add the link for the button";
  else if (link && !n.cta.trim()) e.cta = "Add the button text";
  else if (link && !safeHref(link)) e.cta = "Use a link that starts with https://, mailto:, tel: or /";
  if (n.expiresAt && n.expiresAt <= now) e.time = "The end time is already in the past, so nobody would see it";
  else if (n.expiresAt && n.publishAt && n.expiresAt <= n.publishAt) e.time = "The end time must be after the start time";
  for (const b of n.blocks) {
    if (b.t === "btn" && (b.label.trim() || b.url.trim())) {
      if (!b.label.trim()) e.blocks[b.id] = "Add the button text";
      else if (!safeHref(b.url)) e.blocks[b.id] = "Add a link that starts with https://, mailto:, tel: or /";
    }
    if (b.t === "img" && b.url && httpsErr(b.url)) e.blocks[b.id] = "Picture address must start with https://";
    if (b.t === "gallery" && b.urls.some((u) => u && httpsErr(u))) e.blocks[b.id] = "Every picture address must start with https://";
  }
  if (n.image && httpsErr(n.image)) e.cta = e.cta ?? "Cover picture address must start with https://";
  return e;
}
const hasErr = (e: Errs) => !!(e.title || e.cta || e.time || Object.keys(e.blocks).length);

function BlockEditor({ b, set }: { b: Block; set: (p: Partial<Block>) => void }) {
  const p = (x: Record<string, unknown>) => set(x as Partial<Block>);
  switch (b.t) {
    case "h": return <input className="in" value={b.text} maxLength={120} placeholder="Section heading" onChange={(e) => p({ text: e.target.value })} />;
    case "p": return <Fmt value={b.text} onChange={(v) => p({ text: v })} placeholder="Write your message. Use **bold**, links and line breaks." />;
    case "img": return (
      <>
        <ImgField label="Picture" value={b.url} onChange={(v) => p({ url: v })} />
        <Field label="Caption (optional)"><input className="in" value={b.caption} maxLength={LIMITS.caption} onChange={(e) => p({ caption: e.target.value })} /></Field>
      </>
    );
    case "gallery": return (
      <>
        {b.urls.map((u, i) => (
          <div className="nm-gi" key={i}>
            <ImgField label={`Picture ${i + 1}`} value={u} onChange={(v) => p({ urls: b.urls.map((x, j) => (j === i ? v : x)) })} />
            {b.urls.length > 1 && <button type="button" className="btn sm danger" onClick={() => p({ urls: b.urls.filter((_, j) => j !== i) })}>Remove picture {i + 1}</button>}
          </div>
        ))}
        <button type="button" className="btn" disabled={b.urls.length >= LIMITS.gallery} onClick={() => p({ urls: [...b.urls, ""] })}><Gl n="plus" s={16} /> Add picture</button>
      </>
    );
    case "ul": case "ol": return (
      <Field label="One item per line" hint="Bold, italic and links work here too.">
        <textarea className="in" rows={5} value={b.items.join("\n")} placeholder={"First item\nSecond item"} onChange={(e) => p({ items: e.target.value.split("\n").slice(0, LIMITS.items).map((x) => x.slice(0, LIMITS.item)) })} />
      </Field>
    );
    case "quote": return (
      <>
        <Fmt rows={3} max={600} value={b.text} onChange={(v) => p({ text: v })} placeholder="The quote" />
        <Field label="Who said it (optional)"><input className="in" value={b.by} maxLength={60} onChange={(e) => p({ by: e.target.value })} /></Field>
      </>
    );
    case "callout": return (
      <>
        <Field label="Look"><Seg value={b.tone} onChange={(v) => p({ tone: v })} options={TONES.map((x) => ({ v: x, l: TONE_NAMES[x] }))} /></Field>
        <Fmt rows={3} max={600} value={b.text} onChange={(v) => p({ text: v })} placeholder="A highlighted note" />
      </>
    );
    case "btn": return (
      <>
        <Field label="Button text"><input className="in" value={b.label} maxLength={LIMITS.label} placeholder="e.g. Shop now" onChange={(e) => p({ label: e.target.value })} /></Field>
        <Field label="Link"><input className="in" value={b.url} placeholder="https://" autoCapitalize="none" inputMode="url" onChange={(e) => p({ url: e.target.value })}
          onBlur={() => { const v = b.url.trim(); if (v && !/^([a-z]+:|\/)/i.test(v) && v.includes(".")) p({ url: "https://" + v }); }} /></Field>
        <Field label="Look"><Seg value={b.look} onChange={(v) => p({ look: v })} options={[{ v: "solid", l: "Filled" }, { v: "outline", l: "Outline" }]} /></Field>
      </>
    );
    case "code": return (
      <>
        <Field label="Label (optional)"><input className="in" value={b.label} maxLength={LIMITS.label} placeholder="e.g. Promo code" onChange={(e) => p({ label: e.target.value })} /></Field>
        <Field label="Text to copy" hint="Visitors copy it with one tap."><input className="in mono" value={b.text} maxLength={LIMITS.code} autoCapitalize="none" spellCheck={false} onChange={(e) => p({ text: e.target.value })} /></Field>
      </>
    );
    case "kv": return (
      <>
        {b.rows.map((r, i) => (
          <div className="nm-kv" key={i}>
            <input className="in" value={r.k} maxLength={40} placeholder="Label" onChange={(e) => p({ rows: b.rows.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)) })} />
            <input className="in" value={r.v} maxLength={120} placeholder="Value" onChange={(e) => p({ rows: b.rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })} />
            {b.rows.length > 1 && <button type="button" className="ib" aria-label="Remove row" onClick={() => p({ rows: b.rows.filter((_, j) => j !== i) })}><Gl n="x" s={16} /></button>}
          </div>
        ))}
        <button type="button" className="btn" disabled={b.rows.length >= LIMITS.rows} onClick={() => p({ rows: [...b.rows, { k: "", v: "" }] })}><Gl n="plus" s={16} /> Add row</button>
      </>
    );
    case "hr": return <p className="mut">A thin line to separate sections.</p>;
  }
}

/* ---------- the composer ---------- */
function Composer({ n0, isNew, t, stat, say, onClose, onSaved, onDeleted, onDuplicate }: {
  n0: Notif; isNew: boolean; t: Settings; stat?: NStat; say: Say; onClose: () => void;
  onSaved: (n: Notif) => void; onDeleted: (key: string) => void; onDuplicate: (n: Notif) => void;
}) {
  const [base, setBase] = useState(n0);
  const [n, setN] = useState(n0);
  const [exists, setExists] = useState(!isNew);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [warn, setWarn] = useState(false);
  const [adding, setAdding] = useState(false);

  const now = Date.now();
  const dirty = JSON.stringify(n) !== JSON.stringify(base);
  const errs = check(n, now);
  const showE = tried ? errs : { blocks: {} } as Errs;
  const up = (p: Partial<Notif>) => setN((x) => ({ ...x, ...p }));
  const setBlock = (id: string, p: Partial<Block>) => setN((x) => ({ ...x, blocks: x.blocks.map((b) => (b.id === id ? ({ ...b, ...p } as Block) : b)) }));
  const move = (id: string, d: -1 | 1) => setN((x) => {
    const i = x.blocks.findIndex((b) => b.id === id), j = i + d;
    if (i < 0 || j < 0 || j >= x.blocks.length) return x;
    const a = [...x.blocks]; [a[i], a[j]] = [a[j], a[i]];
    return { ...x, blocks: a };
  });
  const dupBlock = (id: string) => setN((x) => {
    const i = x.blocks.findIndex((b) => b.id === id);
    if (i < 0 || x.blocks.length >= LIMITS.blocks) return x;
    const a = [...x.blocks]; a.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(x.blocks[i])), id: rid() });
    return { ...x, blocks: a };
  });
  const delBlock = (id: string) => setN((x) => ({ ...x, blocks: x.blocks.filter((b) => b.id !== id) }));
  const addBlock = (m: (typeof BLOCKS)[number]) => { if (n.blocks.length >= LIMITS.blocks) return say(`Up to ${LIMITS.blocks} blocks per notification`); up({ blocks: [...n.blocks, m.make()] }); setAdding(false); };

  const future = !!n.publishAt && n.publishAt > now;
  const live = exists && base.status === "published";
  const tryClose = () => { if (dirty) setWarn(true); else onClose(); };

  const save = async (status: "published" | "draft") => {
    setTried(true);
    if (hasErr(check(n, Date.now()))) { say("Fix the highlighted fields first"); setTab("edit"); return; }
    setBusy(true);
    try {
      const out = await saveNotif({ ...n, status, blocks: cleanBlocks(n.blocks) });
      onSaved(out); setBase(out); setN(out); setExists(true); setTried(false); setWarn(false);
      say(status === "draft" ? "Draft saved" : out.publishAt && out.publishAt > Date.now() ? `Scheduled for ${when(out.publishAt)}` : "Published. Visitors can see it now.", true);
      if (status === "published") onClose();
    } catch (e) { say(e instanceof Error && e.message && !/^An error occurred/i.test(e.message) ? e.message : "Could not save. Check your connection and try again."); }
    setBusy(false);
  };
  const again = async () => {
    if (dirty) return say("Save your changes first, then notify again");
    setBusy(true);
    try { const out = await renotify(n.key); onSaved(out); setBase(out); setN(out); say("Sent again. Everyone sees it as new.", true); } catch { say("Could not send it again."); }
    setBusy(false);
  };
  const remove = async () => {
    if (!sure) { setSure(true); setTimeout(() => setSure(false), 3000); return; }
    if (!exists) { onClose(); return; }
    setBusy(true);
    try { await deleteNotif(n.key); onDeleted(n.key); say("Notification deleted", true); } catch { say("Could not delete."); setBusy(false); }
  };
  const duplicate = () => onDuplicate({ ...n, key: rid(), title: `${n.title} copy`.slice(0, LIMITS.title), status: "draft", publishAt: null, expiresAt: null, rev: 1, createdAt: Date.now(), updatedAt: Date.now(), blocks: n.blocks.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: rid() })) });

  const kc = tintOf(n);
  const fresh = isNew && !n.title && !n.blocks.length && !n.summary;

  return (
    <Sheet title={isNew && !exists ? "New notification" : n.title || "Notification"} onClose={tryClose}>
      {warn && (
        <div className="warn nm-warn">
          <span>You have changes that are not saved.</span>
          <span className="line2"><button type="button" className="btn sm" onClick={() => setWarn(false)}>Keep editing</button><button type="button" className="btn sm danger" onClick={onClose}>Discard</button></span>
        </div>
      )}
      <Seg value={tab} onChange={setTab} options={[{ v: "edit", l: "Write" }, { v: "preview", l: "Preview" }]} />

      {tab === "preview" ? (
        <>
          <p className="mut">This is how it looks with your design. The list card is what visitors tap, the page below opens from it.</p>
          <Mini t={t} className="nm-pvm">
            <article className="card surf nc-item un" style={{ "--k": kc } as React.CSSProperties}>
              <span className="nc-main">
                <span className={`nc-ic${n.image ? " ph" : ""}`}>{n.image ? <img src={n.image} alt="" /> : <Glyph k={n.kind} s={22} />}</span>
                <span className="nc-tx">
                  <span className="nc-meta"><i className="nc-kd">{kindOf(n.kind).name}</i><span>Just now</span></span>
                  <b className="nc-tt">{n.title || "Untitled"}</b>
                  {n.summary && <span className="nc-sm">{n.summary}</span>}
                </span>
                <i className="nc-dot" />
              </span>
            </article>
            <article className="nc-detail surf" style={{ "--k": kc } as React.CSSProperties}>
              {n.image && <div className="nc-cover"><img src={n.image} alt="" /></div>}
              <div className="nc-dm"><span className="nc-kd"><Glyph k={n.kind} s={14} />{kindOf(n.kind).name}</span>{n.pinned && <span className="nc-pn">Pinned</span>}<time>Just now</time></div>
              <h2 className="nc-dt">{n.title || "Untitled"}</h2>
              {n.summary && <p className="nc-ds">{inline(n.summary, n.key)}</p>}
              <NotifBody blocks={cleanBlocks(n.blocks)} nk={n.key} title={n.title} preview />
              {n.cta && n.ctaUrl && <a className="nf-btn solid" href="#" onClick={(e) => e.preventDefault()}>{n.cta}</a>}
            </article>
          </Mini>
        </>
      ) : (
        <>
          {fresh && (
            <>
              <h3 className="gh">Start from a template</h3>
              <div className="nm-tpls row">
                {TEMPLATES.map((tp) => (
                  <button type="button" key={tp.id} className="nm-tp" onClick={() => setN((x) => ({ ...x, ...tp.make() }))}>
                    <i style={{ "--kc": kindOf(tp.make().kind ?? "info").color } as React.CSSProperties}><Glyph k={tp.make().kind ?? "info"} s={18} /></i>
                    <span><b>{tp.name}</b><small>{tp.note}</small></span>
                  </button>
                ))}
              </div>
            </>
          )}

          <h3 className="gh">Headline</h3>
          <Field label="Title" error={showE.title}><input className="in" value={n.title} maxLength={LIMITS.title} placeholder="What is this about?" onChange={(e) => up({ title: e.target.value })} /></Field>
          <Field label="Short preview" hint={`${n.summary.length}/${LIMITS.summary}. Shown under the title in the list.`}>
            <input className="in" value={n.summary} maxLength={LIMITS.summary} placeholder="One line that makes people tap" onChange={(e) => up({ summary: e.target.value })} />
          </Field>
          <Field label="Type">
            <div className="nm-kinds">
              {KINDS.map((k) => (
                <button type="button" key={k.id} className={n.kind === k.id ? "on" : ""} aria-pressed={n.kind === k.id} style={{ "--kc": k.color } as React.CSSProperties} onClick={() => up({ kind: k.id as KindId })}><Glyph k={k.id} s={18} />{k.name}</button>
              ))}
            </div>
          </Field>
          <OptColor label="Accent color" value={n.color} auto={kindOf(n.kind).color} onChange={(v) => up({ color: v })} />
          <ImgField label="Cover picture (optional)" value={n.image} onChange={(v) => up({ image: v })} />

          <h3 className="gh">Content</h3>
          {!n.blocks.length && <p className="mut">Add text, pictures, lists, buttons and more. Blocks stack in the order below.</p>}
          {n.blocks.map((b, i) => (
            <div className={"nm-b" + (showE.blocks[b.id] ? " bad" : "")} key={b.id}>
              <div className="nm-bh">
                <span className="nm-bt"><Gl n={meta(b.t).glyph} s={16} />{meta(b.t).name}</span>
                <span className="nm-bc">
                  <button type="button" className="ib" aria-label="Move up" disabled={i === 0} onClick={() => move(b.id, -1)}><Gl n="up" s={16} /></button>
                  <button type="button" className="ib" aria-label="Move down" disabled={i === n.blocks.length - 1} onClick={() => move(b.id, 1)}><Gl n="down" s={16} /></button>
                  <button type="button" className="ib" aria-label="Duplicate block" onClick={() => dupBlock(b.id)}><Gl n="copy" s={16} /></button>
                  <button type="button" className="ib" aria-label="Delete block" onClick={() => delBlock(b.id)}><Gl n="trash" s={16} /></button>
                </span>
              </div>
              <BlockEditor b={b} set={(p) => setBlock(b.id, p)} />
              {showE.blocks[b.id] && <em className="fe">{showE.blocks[b.id]}</em>}
            </div>
          ))}
          {adding ? (
            <div className="nm-add">
              {BLOCKS.map((m) => <button type="button" key={m.t} onClick={() => addBlock(m)}><Gl n={m.glyph} s={20} />{m.name}</button>)}
              <button type="button" className="x" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          ) : <button type="button" className="btn" onClick={() => setAdding(true)}><Gl n="plus" s={18} /> Add a block</button>}

          <h3 className="gh">Main button</h3>
          <p className="mut">Optional. Shows at the bottom of the notification.</p>
          <div className="g2">
            <Field label="Button text" error={showE.cta}><input className="in" value={n.cta} maxLength={LIMITS.label} placeholder="e.g. Read more" onChange={(e) => up({ cta: e.target.value })} /></Field>
            <Field label="Link"><input className="in" value={n.ctaUrl} placeholder="https://" autoCapitalize="none" inputMode="url" onChange={(e) => up({ ctaUrl: e.target.value })}
              onBlur={() => { const v = n.ctaUrl.trim(); if (v && !/^([a-z]+:|\/)/i.test(v) && v.includes(".")) up({ ctaUrl: "https://" + v }); }} /></Field>
          </div>

          <h3 className="gh">Delivery</h3>
          <Switch on={n.pinned} onChange={(v) => up({ pinned: v })} label="Pin to the top" hint="Stays above newer posts" />
          <Switch on={n.quiet} onChange={(v) => up({ quiet: v })} label="Quiet post" hint="Listed, but never rings the bell or adds to its count" />
          <Field label="Start" error={showE.time} hint={!future && exists && base.publishAt ? `Went live ${when(base.publishAt)}` : undefined}>
            <Seg value={future ? "later" : "now"} onChange={(v) => up({ publishAt: v === "later" ? (future ? n.publishAt : Date.now() + 3600e3) : base.publishAt && base.publishAt <= Date.now() ? base.publishAt : null })} options={[{ v: "now", l: "As soon as published" }, { v: "later", l: "Schedule" }]} />
          </Field>
          {future && <input className="in" type="datetime-local" aria-label="Start time" value={toLocal(n.publishAt)} onChange={(e) => up({ publishAt: fromLocal(e.target.value) })} />}
          <Switch on={n.expiresAt != null} onChange={(v) => up({ expiresAt: v ? (n.publishAt ?? Date.now()) + 7 * 864e5 : null })} label="Hide automatically" hint="Disappears for visitors after the time below" />
          {n.expiresAt != null && <input className="in" type="datetime-local" aria-label="End time" value={toLocal(n.expiresAt)} onChange={(e) => up({ expiresAt: fromLocal(e.target.value) })} />}

          {exists && (
            <>
              <h3 className="gh">Manage</h3>
              {(stat?.opens || stat?.clicks) ? <p className="nm-eng"><Gl n="eye" s={14} /> {stat.opens} {stat.opens === 1 ? "person" : "people"} opened it{stat.clicks ? ` · ${stat.clicks} button taps` : ""}</p> : null}
              <div className="line2">
                {live && stateOf(base, now) === "live" && <button type="button" className="btn" disabled={busy} onClick={again}><Gl n="send" s={16} /> Notify again</button>}
                <button type="button" className="btn" onClick={duplicate}><Gl n="copy" s={16} /> Duplicate</button>
                <button type="button" className={"btn danger" + (sure ? " on" : "")} disabled={busy} onClick={remove}>{sure ? "Tap again to delete" : "Delete"}</button>
              </div>
              {live && <p className="mut">Notify again puts it back at the top and shows it as new to everyone, even people who already read it.</p>}
            </>
          )}
        </>
      )}

      <div className="nm-bar">
        {live
          ? <button type="button" className="btn" disabled={busy} onClick={() => save("draft")}>Unpublish</button>
          : <button type="button" className="btn" disabled={busy || !dirty && exists} onClick={() => save("draft")}>Save draft</button>}
        <span className="sp" />
        <button type="button" className="btn pri" disabled={busy || (live && !dirty)} onClick={() => save("published")}>
          {busy ? "Saving..." : live ? "Save changes" : future ? "Schedule" : "Publish"}
        </button>
      </div>
    </Sheet>
  );
}
