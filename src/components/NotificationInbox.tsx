"use client";
import { useMemo, useState } from "react";

type Notice = { id:number; title:string; excerpt:string|null; body:string; image:string|null; category:string; pinned:boolean; publishedAt:string|null };
const READ = "savahphx-notification-read", DELETED = "savahphx-notification-deleted";
function Inline({ text }: { text:string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return <>{parts.map((p,i) => p.startsWith("**") ? <strong key={i}>{p.slice(2,-2)}</strong> : p.startsWith("*") ? <em key={i}>{p.slice(1,-1)}</em> : p)}</>;
}
function RichBody({ body }: { body:string }) {
  return <div className="notice-rich">{body.split("\n").map((line,i) => {
    if (line.startsWith("### ")) return <h3 key={i}><Inline text={line.slice(4)} /></h3>;
    if (line.startsWith("## ")) return <h2 key={i}><Inline text={line.slice(3)} /></h2>;
    if (line.startsWith("# ")) return <h2 key={i}><Inline text={line.slice(2)} /></h2>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <p className="notice-bullet" key={i}>• <Inline text={line.slice(2)} /></p>;
    if (/^https:\/\//.test(line.trim())) return <p key={i}><a href={line.trim()} target="_blank" rel="noopener noreferrer">{line.trim()}</a></p>;
    return line ? <p key={i}><Inline text={line} /></p> : <div className="notice-space" key={i} />;
  })}</div>;
}
export default function NotificationInbox({ initial }: { initial:Notice[] }) {
  const [read,setRead] = useState<number[]>(() => { if(typeof window==="undefined") return []; try{return JSON.parse(localStorage.getItem(READ)||"[]");}catch{return [];} });
  const [deleted,setDeleted] = useState<number[]>(() => { if(typeof window==="undefined") return []; try{return JSON.parse(localStorage.getItem(DELETED)||"[]");}catch{return [];} });
  const [filter,setFilter] = useState<"all"|"unread">("all");
  const [expanded,setExpanded] = useState<number|null>(null);
  const items = useMemo(()=>initial.filter(n=>!deleted.includes(n.id)).filter(n=>filter==="all"||!read.includes(n.id)),[initial,deleted,read,filter]);
  const unread = initial.filter(n=>!deleted.includes(n.id)&&!read.includes(n.id)).length;
  const save = (key:string, value:number[]) => { try{localStorage.setItem(key,JSON.stringify(value));}catch{} };
  const mark = (id:number) => { const next=[...new Set([...read,id])];setRead(next);save(READ,next); };
  const markAll = () => { const next=initial.map(n=>n.id);setRead(next);save(READ,next); };
  const remove = (id:number) => { const next=[...deleted,id];setDeleted(next);save(DELETED,next);if(expanded===id)setExpanded(null); };
  return <main className="notice-page">
    <header className="notice-top"><a href="/" className="notice-back" aria-label="Back to profile">←</a><div><span className="notice-eyebrow">SAVAH PHX</span><h1>Notifications</h1><p>{unread ? `${unread} unread update${unread===1?"":"s"}` : "You're all caught up."}</p></div></header>
    <div className="notice-tools"><div className="notice-filters"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>All <span>{initial.length-deleted.length}</span></button><button className={filter==="unread"?"active":""} onClick={()=>setFilter("unread")}>Unread <span>{unread}</span></button></div>{unread>0&&<button className="notice-markall" onClick={markAll}>Mark all as read</button>}</div>
    <section className="notice-list">
      {!items.length&&<div className="notice-empty"><span>✓</span><h2>{filter==="unread"?"No unread notifications":"Nothing here yet"}</h2><p>New announcements and updates will appear here.</p></div>}
      {items.map(n=><article className={`notice-item${read.includes(n.id)?" is-read":""}`} key={n.id}>
        <button className="notice-open" onClick={()=>{setExpanded(expanded===n.id?null:n.id);if(!read.includes(n.id))mark(n.id);}}>
          <span className="notice-symbol">{n.pinned?"✦":"●"}</span><span className="notice-summary"><span className="notice-meta">{n.category}{n.pinned?" · PINNED":""}</span><strong>{n.title}</strong><span>{n.excerpt||n.body.slice(0,140)}</span><small>{n.publishedAt?new Date(n.publishedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):""}</small></span><span className="notice-chevron">{expanded===n.id?"−":"+"}</span>
        </button>
        {expanded===n.id&&<div className="notice-detail">{n.image&&<img src={n.image} alt="" /> }<RichBody body={n.body}/><div className="notice-actions"><button onClick={()=>mark(n.id)}>✓ Mark as read</button><button onClick={()=>remove(n.id)}>Delete from my inbox</button></div></div>}
      </article>)}
    </section>
    <footer className="notice-footer"><a href="/">Back to profile</a></footer>
  </main>;
}
