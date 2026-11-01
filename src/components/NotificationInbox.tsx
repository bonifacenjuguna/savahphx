"use client";
import { useEffect, useMemo, useState } from "react";
import NotificationRichText from "./NotificationRichText";

type Notice = { id:number; title:string; excerpt:string|null; body:string; image:string|null; category:string; pinned:boolean; publishedAt:string|Date|null };
const READ = "savahphx-notification-read", DELETED = "savahphx-notification-deleted";
export default function NotificationInbox({ initial }: { initial:Notice[] }) {
  const [read,setRead] = useState<number[]>([]);
  const [deleted,setDeleted] = useState<number[]>([]);
  useEffect(() => { try { setRead(JSON.parse(localStorage.getItem(READ)||"[]")); setDeleted(JSON.parse(localStorage.getItem(DELETED)||"[]")); } catch {} }, []);
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
        {expanded===n.id&&<div className="notice-detail">{n.image&&<img src={n.image} alt="" /> }<NotificationRichText body={n.body}/><div className="notice-actions"><button onClick={()=>mark(n.id)}>✓ Mark as read</button><button onClick={()=>remove(n.id)}>Delete from my inbox</button></div></div>}
      </article>)}
    </section>
    <footer className="notice-footer"><a href="/">Back to profile</a></footer>
  </main>;
}
