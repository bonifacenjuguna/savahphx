"use client";
import NetLogo from "./NetLogo";
import { useEffect, useRef, useState } from "react";
import { netById, shortAddr } from "@/lib/crypto";
import type { Row } from "@/lib/theme";
import Modal from "./Modal";

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    try {
      const a = document.createElement("textarea");
      a.value = t; a.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(a); a.select();
      const ok = document.execCommand("copy"); a.remove(); return ok;
    } catch { return false; }
  }
}

const Close = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;

// Two overlapping squares that turn into a check when copied.
export function CopyBtn({ text, id, title, big, label }: { text: string; id: string; title: string; big?: boolean; label?: string }) {
  const [st, setSt] = useState<"idle" | "ok" | "err">("idle");
  const go = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSt((await copyText(text)) ? "ok" : "err");
    setTimeout(() => setSt("idle"), 1700);
  };
  return (
    <button type="button" className={`cp${big ? " big" : ""} ${st}`} aria-label={label ?? "Copy"} data-tk={id} data-ta="copy" data-tt={title} onClick={go}>
      <svg className="ic cc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12.5" height="12.5" rx="3.4" /><path d="M16 8V6.4A3.4 3.4 0 0 0 12.6 3H6.4A3.4 3.4 0 0 0 3 6.4v6.2A3.4 3.4 0 0 0 6.4 16H8" /></svg>
      <svg className="ic ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      {big && <span>{st === "ok" ? "Copied" : st === "err" ? "Could not copy" : label ?? "Copy"}</span>}
    </button>
  );
}

export function NoteCard({ r, cls, i }: { r: Row; cls: string; i: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`card surf note ${cls}`} style={{ "--i": i } as React.CSSProperties}>
      <button type="button" className="cl" data-tk={r.key} data-ta="open" data-tt={r.title} aria-label={`Open ${r.title}`} onClick={() => setOpen(true)}>
        <span className="nt"><small>{r.title}</small><span className="nx">{r.body}</span></span>
      </button>
      <CopyBtn text={r.body} id={r.key} title={r.title} label={`Copy ${r.title}`} />
      {open && (
        <Modal anchor={ref} onClose={() => setOpen(false)}>
          <div className="mp" role="dialog" aria-label={r.title}>
            <header><b>{r.title}</b><button type="button" className="mx" aria-label="Close" onClick={() => setOpen(false)}><Close /></button></header>
            <p className="mb">{r.body}</p>
            <CopyBtn big text={r.body} id={r.key} title={r.title} label="Copy text" />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Qr({ text }: { text: string }) {
  const [src, setSrc] = useState("");
  const [bad, setBad] = useState(false);
  useEffect(() => {
    let live = true;
    import("qrcode")
      .then((m) => ((m as unknown as { default?: typeof m }).default ?? m).toDataURL(text, { margin: 1, width: 560, errorCorrectionLevel: "M", color: { dark: "#0b0d12", light: "#ffffff" } }))
      .then((u) => live && setSrc(u))
      .catch(() => live && setBad(true));
    return () => { live = false; };
  }, [text]);
  return bad ? <span className="qrbad">QR code unavailable</span> : src ? <img className="qr" src={src} alt="QR code of the wallet address" /> : <span className="qr sk" />;
}

export function WalletCard({ r, cls, i }: { r: Row; cls: string; i: number }) {
  const net = netById(r.network);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`card surf wallet ${cls}`} style={{ "--i": i, "--net": net?.color ?? "#8a93a8" } as React.CSSProperties}>
      <button type="button" className="cl" data-tk={r.key} data-ta="open" data-tt={r.title} aria-label={`Open ${r.title} wallet`} onClick={() => setOpen(true)}>
        <NetLogo net={net} />
        <span className="nt"><b className="wn">{r.title}</b><small className="mono">{shortAddr(r.body)}</small></span>
      </button>
      <CopyBtn text={r.body} id={r.key} title={r.title} label={`Copy ${r.title} address`} />
      {open && (
        <Modal anchor={ref} onClose={() => setOpen(false)}>
          <div className="mp wm" role="dialog" aria-label={`${r.title} wallet`} style={{ "--net": net?.color ?? "#8a93a8" } as React.CSSProperties}>
            <header>
              <NetLogo net={net} lg />
              <div className="wh"><b>{r.title}</b><small>{net?.name ?? "Wallet"}</small></div>
              <button type="button" className="mx" aria-label="Close" onClick={() => setOpen(false)}><Close /></button>
            </header>
            {r.qr && <div className="qrw"><Qr text={r.body} /></div>}
            <div className="ad"><small>Wallet address</small><code>{r.body}</code></div>
            <CopyBtn big text={r.body} id={r.key} title={r.title} label="Copy address" />
            {r.memo && <div className="ad"><small>{net?.memo ?? "Memo or tag"}</small><code>{r.memo}</code><CopyBtn big text={r.memo} id={r.key} title={`${r.title} memo`} label="Copy memo" /></div>}
            <p className="wr">Only send {net?.name ?? "matching"} assets to this address. Check the network before you send.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
