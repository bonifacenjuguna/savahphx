import type { ReactNode } from "react";
import { safeUrl } from "./notes";

// A small, safe formatter for notification text (no raw HTML is ever used).
// **bold**  *italic*  ~~strike~~  ==highlight==  `code`  [text](link)  links paste as links
// # Heading  ## Smaller  - bullets  1. numbers  - [ ] tasks  > quote  --- divider  !tip / !info / !warn callouts  ![alt](https://image)

const INLINE = /(\*\*(?!\s)[\s\S]+?\*\*)|(~~[\s\S]+?~~)|(==[\s\S]+?==)|(`[^`\n]+?`)|(\[[^\]\n]+?\]\([^)\s]+?\))|(\*(?![\s*])[^*\n]+?\*)|(\b_(?![\s_])[^_\n]+?_\b)|(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g;

function inline(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0, i = 0, m: RegExpExecArray | null;
  // A fresh regex per call: nested calls (bold inside a line) must not share one cursor, or the outer loop never ends.
  const re = new RegExp(INLINE.source, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0], key = `${k}.${i++}`;
    if (m[1]) out.push(<strong key={key}>{inline(t.slice(2, -2), key)}</strong>);
    else if (m[2]) out.push(<s key={key}>{inline(t.slice(2, -2), key)}</s>);
    else if (m[3]) out.push(<mark key={key}>{inline(t.slice(2, -2), key)}</mark>);
    else if (m[4]) out.push(<code key={key}>{t.slice(1, -1)}</code>);
    else if (m[5]) {
      const x = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
      if (x && safeUrl(x[2])) out.push(<a key={key} href={x[2]} target="_blank" rel="noopener noreferrer">{inline(x[1], key)}</a>);
      else out.push(t);
    } else if (m[6] || m[7]) out.push(<em key={key}>{inline(t.slice(1, -1), key)}</em>);
    else out.push(<a key={key} href={t} target="_blank" rel="noopener noreferrer">{t.replace(/^https?:\/\/(www\.)?/, "")}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const lines = (text: string, k: string): ReactNode[] =>
  text.split("\n").flatMap((l, i, a) => [...inline(l, `${k}.${i}`), ...(i < a.length - 1 ? [<br key={`${k}.br${i}`} />] : [])]);

export function renderMd(src: string): ReactNode[] {
  const L = src.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let i = 0, n = 0;
  const key = () => "b" + n++;
  const isBlock = (s: string) => /^(#{1,3} |[-*] |\d+[.)] |> ?|---+\s*$|!(tip|info|warn) |!\[[^\]]*\]\(https:\/\/[^)\s]+\)\s*$)/.test(s);
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m: RegExpExecArray | null;
    if ((m = /^(#{1,3}) (.+)$/.exec(l))) { const H = (["h3", "h4", "h5"] as const)[m[1].length - 1]; out.push(<H key={key()} className="nh">{inline(m[2], "h")}</H>); i++; continue; }
    if (/^---+\s*$/.test(l)) { out.push(<hr key={key()} />); i++; continue; }
    if ((m = /^!(tip|info|warn) (.+)$/.exec(l))) {
      const ic = m[1] === "tip" ? "💡" : m[1] === "warn" ? "⚠️" : "ℹ️";
      out.push(<div key={key()} className={`nc ${m[1]}`}><span aria-hidden>{ic}</span><div>{lines(m[2], "c")}</div></div>); i++; continue;
    }
    if ((m = /^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)\s*$/.exec(l))) { out.push(<img key={key()} className="ni" src={m[2]} alt={m[1]} loading="lazy" />); i++; continue; }
    if (/^> ?/.test(l)) {
      const q: string[] = [];
      while (i < L.length && /^> ?/.test(L[i])) q.push(L[i++].replace(/^> ?/, ""));
      out.push(<blockquote key={key()}>{lines(q.join("\n"), "q")}</blockquote>); continue;
    }
    if (/^[-*] /.test(l)) {
      const items: string[] = [];
      while (i < L.length && /^[-*] /.test(L[i])) items.push(L[i++].slice(2));
      out.push(<ul key={key()}>{items.map((t, j) => {
        const c = /^\[( |x|X)\] (.*)$/.exec(t);
        return c ? <li key={j} className={`task${c[1] === " " ? "" : " done"}`}><i aria-hidden>{c[1] === " " ? "" : "✓"}</i><span>{inline(c[2], `t${j}`)}</span></li> : <li key={j}>{inline(t, `l${j}`)}</li>;
      })}</ul>); continue;
    }
    if (/^\d+[.)] /.test(l)) {
      const items: string[] = [];
      while (i < L.length && /^\d+[.)] /.test(L[i])) items.push(L[i++].replace(/^\d+[.)] /, ""));
      out.push(<ol key={key()}>{items.map((t, j) => <li key={j}>{inline(t, `o${j}`)}</li>)}</ol>); continue;
    }
    const p: string[] = [];
    while (i < L.length && L[i].trim() && (p.length === 0 || !isBlock(L[i]))) p.push(L[i++]);
    out.push(<p key={key()}>{lines(p.join("\n"), "p")}</p>);
  }
  return out;
}

// Plain-text version for previews and list rows.
export const plain = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^(#{1,3} |[-*] |\d+[.)] |> ?|!(tip|info|warn) )/gm, "").replace(/(\*\*|~~|==|`|\*|_)/g, "").replace(/^---+$/gm, "").replace(/\s+/g, " ").trim();
