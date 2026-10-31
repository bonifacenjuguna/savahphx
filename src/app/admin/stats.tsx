"use client";
import { useCallback, useEffect, useState } from "react";
import { Gl, Seg, Sheet } from "./ui";
import { clearStats, getStats, ignoreDevice, ignoreLink, type Stats } from "./stats-actions";

const REF: Record<string, string> = {
  "l.instagram.com": "Instagram", "instagram.com": "Instagram", "l.facebook.com": "Facebook", "m.facebook.com": "Facebook", "facebook.com": "Facebook",
  "t.co": "X (Twitter)", "x.com": "X (Twitter)", "twitter.com": "X (Twitter)", "youtube.com": "YouTube", "m.youtube.com": "YouTube",
  "tiktok.com": "TikTok", "l.threads.net": "Threads", "threads.net": "Threads", "threads.com": "Threads", "t.me": "Telegram", "wa.me": "WhatsApp", "web.whatsapp.com": "WhatsApp",
};
const refLabel = (x: string) => REF[x] ?? x;
const country = (c: string) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c; } catch { return c; } };
const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

function useCount(n: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => { const p = Math.min(1, (t - t0) / 800); setV(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return v;
}
const Kpi = ({ label, n, suffix = "" }: { label: string; n: number; suffix?: string }) => { const v = useCount(n); return <div className="kpi"><b>{v}{suffix}</b><small>{label}</small></div>; };

function days(data: Stats) {
  const map = new Map(data.daily.map((d) => [d.d, d]));
  return Array.from({ length: data.days }, (_, i) => {
    const d = new Date(Date.now() - (data.days - 1 - i) * 864e5).toISOString().slice(0, 10);
    return { d, views: map.get(d)?.views ?? 0, actions: map.get(d)?.actions ?? 0 };
  });
}

function Bars({ rows }: { rows: { x: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return <div className="hb">{rows.length ? rows.map((r) => <div key={r.x} className="hr"><span>{r.x}</span><i style={{ width: `${(r.n / max) * 100}%` }} /><b>{r.n}</b></div>) : <p className="mut">Nothing yet.</p>}</div>;
}

// Small summary card on the dashboard.
export function StatsSummary({ onOpen }: { onOpen: () => void }) {
  const [d, setD] = useState<Stats | null>(null);
  const [bad, setBad] = useState(false);
  useEffect(() => { getStats(7).then(setD).catch(() => setBad(true)); }, []);
  const rows = d ? days(d) : [];
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <button type="button" className="panel stc" onClick={onOpen}>
      <div className="ph"><h2><Gl n="stats" s={18} /> Stats</h2><span className="lv">{d && d.tot.live > 0 ? <><i className="dot" />{d.tot.live} online now</> : "Last 7 days"}</span></div>
      {bad ? <p className="mut">Stats unavailable right now.</p> : !d ? <div className="skl"><i /><i /><i /></div> : (
        <>
          <div className="kpis"><Kpi label="Views" n={d.tot.views} /><Kpi label="Visitors" n={d.tot.visitors} /><Kpi label="Clicks" n={d.tot.clicks + d.tot.opens} /></div>
          <div className="spark">{rows.map((r) => <i key={r.d} style={{ height: `${Math.max(6, (r.views / max) * 100)}%` }} />)}</div>
        </>
      )}
      <span className="more">Tap for full stats <Gl n="chev" s={16} /></span>
    </button>
  );
}

export function StatsSheet({ onClose, say }: { onClose: () => void; say: (m: string) => void }) {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [d, setD] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [sure, setSure] = useState(false);

  const load = useCallback(async (n: number) => {
    setBusy(true); setErr("");
    try { setD(await getStats(n)); } catch { setErr("Could not load stats. Check that your database is connected."); }
    setBusy(false);
  }, []);
  useEffect(() => { load(range); const t = setInterval(() => load(range), 30000); return () => clearInterval(t); }, [range, load]);

  const rows = d ? days(d) : [];
  const max = Math.max(1, ...rows.map((r) => Math.max(r.views, r.actions)));
  const topMax = Math.max(1, ...(d?.top.map((t) => t.clicks + t.other) ?? [1]));
  const dMax = Math.max(1, ...(d?.dist ?? [1]));
  const hMax = Math.max(1, ...(d?.hours ?? [1]));
  const clickRate = d && d.tot.views ? Math.round(((d.tot.clicks + d.tot.opens) / d.tot.views) * 100) : 0;

  return (
    <Sheet title="Stats" onClose={onClose}>
      <div className="srow">
        <Seg value={String(range) as "7" | "30" | "90"} onChange={(v) => setRange(Number(v) as 7 | 30 | 90)} options={[{ v: "7", l: "7 days" }, { v: "30", l: "30 days" }, { v: "90", l: "90 days" }]} />
        <button type="button" className={"ib" + (busy ? " spinning" : "")} onClick={() => load(range)} aria-label="Refresh"><Gl n="refresh" /></button>
      </div>
      {err && <p className="warn">{err}</p>}
      {!d && !err && <div className="skl big"><i /><i /><i /></div>}
      {d && (
        <>
          <p className="lv big">{d.tot.live > 0 ? <><i className="dot" />{d.tot.live} {d.tot.live === 1 ? "person" : "people"} online right now</> : "Nobody online right now"}</p>
          <div className="kpis five">
            <Kpi label="Views" n={d.tot.views} /><Kpi label="Visitors" n={d.tot.visitors} /><Kpi label="Clicks" n={d.tot.clicks} />
            <Kpi label="Copies" n={d.tot.copies} /><Kpi label="Click rate" n={clickRate} suffix="%" />
          </div>

          <h3 className="gh">Activity</h3>
          <div className="chart" aria-label="Views and actions per day">
            {rows.map((r, i) => (
              <div key={r.d} className="cb" title={`${r.d}: ${r.views} views, ${r.actions} actions`}>
                <i className="b1" style={{ height: `${(r.views / max) * 100}%`, animationDelay: `${i * 12}ms` }} />
                <i className="b2" style={{ height: `${(r.actions / max) * 100}%`, animationDelay: `${i * 12 + 60}ms` }} />
              </div>
            ))}
          </div>
          <p className="legend"><i className="k1" /> Views <i className="k2" /> Clicks and copies</p>

          <h3 className="gh">Top links</h3>
          {d.top.length ? d.top.map((t) => (
            <div className="tl" key={t.k}>
              <i style={{ width: `${((t.clicks + t.other) / topMax) * 100}%` }} />
              <b>{t.title}</b>
              <span>{t.clicks} clicks{t.other ? ` · ${t.other} copies/opens` : ""} · {t.people} {t.people === 1 ? "person" : "people"}</span>
            </div>
          )) : <p className="mut">No clicks yet. They show up here as people use your links.</p>}

          <h3 className="gh">How many links each visitor used</h3>
          <div className="hb">
            {["1 link", "2 links", "3 links", "4 or more"].map((l, i) => <div key={l} className="hr"><span>{l}</span><i style={{ width: `${(d.dist[i] / dMax) * 100}%` }} /><b>{d.dist[i]}</b></div>)}
          </div>
          {d.combos.length > 0 && <>
            <h3 className="gh">Links used together</h3>
            {d.combos.map((c, i) => <div className="combo" key={i}><span>{c.titles.map((t) => <em key={t}>{t}</em>)}</span><b>{c.n}x</b></div>)}
          </>}

          <h3 className="gh">Recent visitors</h3>
          {d.visitors.length ? d.visitors.map((v) => (
            <div className={"vis" + (open === v.v ? " on" : "")} key={v.v}>
              <button type="button" onClick={() => setOpen(open === v.v ? null : v.v)}>
                <span className="va">{v.v.slice(0, 2).toUpperCase()}</span>
                <span className="vt"><b>Visitor {v.v.slice(0, 4).toUpperCase()}</b><small>{[v.device, v.os, v.browser].filter(Boolean).join(" · ")}{v.country ? ` · ${v.city ? v.city + ", " : ""}${country(v.country)}` : ""}</small></span>
                <span className="vm"><small>{ago(v.last)}</small><small>{v.actions} actions</small></span>
              </button>
              {open === v.v && (
                <div className="vd">
                  <p>First seen {ago(v.first)} · {v.views} {v.views === 1 ? "visit" : "visits"} · from {v.ref ? refLabel(v.ref) : "Direct"}</p>
                  {v.did.length ? <div className="chips">{v.did.map((x) => <em key={x.title}>{x.title}{x.n > 1 ? ` x${x.n}` : ""}</em>)}</div> : <p className="mut">Only looked around, no clicks.</p>}
                </div>
              )}
            </div>
          )) : <p className="mut">No visitors recorded yet.</p>}

          <h3 className="gh">Where they come from</h3><Bars rows={d.groups.ref.map((r) => ({ x: refLabel(r.x), n: r.n }))} />
          <h3 className="gh">Countries</h3><Bars rows={d.groups.country.map((r) => ({ x: r.x === "Unknown" ? r.x : country(r.x), n: r.n }))} />
          <h3 className="gh">Devices</h3><Bars rows={d.groups.device} />
          <h3 className="gh">Browsers and apps</h3><Bars rows={d.groups.browser} />

          <h3 className="gh">Busiest hours (UTC)</h3>
          <div className="hours">{d.hours.map((n, h) => <i key={h} title={`${h}:00 - ${n} views`} style={{ height: `${Math.max(4, (n / hMax) * 100)}%`, opacity: n ? 1 : 0.25 }} />)}</div>
          <p className="legend"><span>0h</span><span>12h</span><span>23h</span></p>
        </>
      )}

      <h3 className="gh">Privacy and your own visits</h3>
      <p className="mut">Your own visits are never counted: signing in marks this device, and an active admin session is always skipped. Visitors are anonymous (no names or IP addresses are stored).</p>
      <div className="line2">
        <button type="button" className="btn" onClick={() => ignoreDevice().then(() => say("This device is now excluded.")).catch(() => say("Could not update."))}>Exclude this device</button>
        <button type="button" className="btn" onClick={() => ignoreLink().then(async (l) => { try { await navigator.clipboard.writeText(location.origin + l); say("Link copied. Open it on any device you want excluded."); } catch { say("Could not copy the link."); } }).catch(() => say("Could not create the link."))}>Copy link for other devices</button>
      </div>
      {sure
        ? <button type="button" className="btn danger on" onClick={() => clearStats().then(() => { setSure(false); load(range); say("All stats cleared."); }).catch(() => say("Could not clear stats."))}>Tap again to clear all stats</button>
        : <button type="button" className="btn danger" onClick={() => setSure(true)}>Clear all stats</button>}
    </Sheet>
  );
}
