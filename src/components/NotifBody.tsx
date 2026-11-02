import { Fragment } from "react";
import { KIND_GLYPH, safeHref, type Block } from "@/lib/notifs";
import { CopyBtn } from "./Cards";
import ZoomImg from "./Zoom";

const ext = (u: string) => (/^https?:/i.test(u) ? { target: "_blank", rel: "noopener noreferrer" } : {});

export const Glyph = ({ k, s = 20 }: { k: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden dangerouslySetInnerHTML={{ __html: KIND_GLYPH[k] ?? KIND_GLYPH.info }} />
);

// **bold**, *italic*, ~~strike~~, `code` and [text](link). Everything is rendered as elements, never as raw HTML.
const TOK = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|~~[^~\n]+~~|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g;
export function inline(text: string, nk?: string): React.ReactNode[] {
  return text.split(TOK).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{inline(part.slice(2, -2), nk)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) return <del key={i}>{inline(part.slice(2, -2), nk)}</del>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i} className="nf-ic">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{inline(part.slice(1, -1), nk)}</em>;
    const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (m) {
      const href = safeHref(m[2]);
      return href ? <a key={i} className="nf-a" href={href} data-nl={nk} {...ext(href)}>{m[1]}</a> : <Fragment key={i}>{m[1]}</Fragment>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// preview: used inside the dashboard, where pictures should not open full-screen viewers.
export default function NotifBody({ blocks, nk, title, preview }: { blocks: Block[]; nk: string; title: string; preview?: boolean }) {
  const Img = (src: string, alt = "") => (preview ? <img src={src} alt={alt} /> : <ZoomImg src={src} alt={alt} />);
  return (
    <div className="nf">
      {blocks.map((b) => {
        switch (b.t) {
          case "h": return <h3 key={b.id} className="nf-h">{inline(b.text, nk)}</h3>;
          case "p": return <p key={b.id} className="nf-p">{inline(b.text, nk)}</p>;
          case "img": return <figure key={b.id} className="nf-img">{Img(b.url, b.caption)}{b.caption && <figcaption>{inline(b.caption, nk)}</figcaption>}</figure>;
          case "gallery": return <div key={b.id} className={`nf-gal g${b.urls.length > 4 ? 6 : b.urls.length}`}>{b.urls.map((u, i) => <div key={i}>{Img(u)}</div>)}</div>;
          case "ul": return <ul key={b.id} className="nf-l">{b.items.filter(Boolean).map((x, i) => <li key={i}>{inline(x, nk)}</li>)}</ul>;
          case "ol": return <ol key={b.id} className="nf-l o">{b.items.filter(Boolean).map((x, i) => <li key={i}>{inline(x, nk)}</li>)}</ol>;
          case "quote": return <blockquote key={b.id} className="nf-q"><p>{inline(b.text, nk)}</p>{b.by && <cite>{b.by}</cite>}</blockquote>;
          case "callout": return (
            <div key={b.id} className={`nf-co ${b.tone}`}><span className="nf-ci"><Glyph k={b.tone} s={20} /></span><div>{inline(b.text, nk)}</div></div>
          );
          case "btn": return <a key={b.id} className={`nf-btn ${b.look}`} href={safeHref(b.url) || "#"} data-nl={nk} {...ext(b.url)}>{b.label}</a>;
          case "code": return (
            <div key={b.id} className="nf-cd">
              <span className="nf-cx">{b.label && <small>{b.label}</small>}<code>{b.text}</code></span>
              <CopyBtn text={b.text} id={nk} title={title || "Notification"} label={`Copy ${b.label || "text"}`} />
            </div>
          );
          case "kv": return <dl key={b.id} className="nf-kv">{b.rows.map((r, i) => <div key={i}><dt>{r.k}</dt><dd>{inline(r.v, nk)}</dd></div>)}</dl>;
          case "hr": return <hr key={b.id} className="nf-hr" />;
        }
      })}
    </div>
  );
}
