"use server";
import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { ensureSchema } from "@/db/ensure";
import { ignoreToken, isAdmin } from "@/lib/auth";

export type Stats = {
  days: number;
  tot: { views: number; visitors: number; clicks: number; copies: number; opens: number; shares: number; live: number };
  daily: { d: string; views: number; actions: number }[];
  top: { k: string; title: string; clicks: number; other: number; people: number }[];
  dist: number[]; // visitors by number of different links used: 1, 2, 3, 4+
  combos: { titles: string[]; n: number }[];
  visitors: { v: string; first: string; last: string; views: number; actions: number; country: string; city: string; device: string; os: string; browser: string; ref: string; did: { title: string; n: number }[] }[];
  groups: Record<"ref" | "country" | "device" | "browser", { x: string; n: number }[]>;
  hours: number[];
};

export async function getStats(days: number): Promise<Stats> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const d = [7, 30, 90].includes(days) ? days : 7;
  await ensureSchema();
  const sql = neon(process.env.DATABASE_URL!);
  const [tot, daily, top, vis, acts, src, hrs] = await Promise.all([
    sql`select count(*) filter (where t='view')::int as views,
      count(distinct v) filter (where t='view')::int as visitors,
      count(*) filter (where t in ('click','icon'))::int as clicks,
      count(*) filter (where t in ('copy','copylink'))::int as copies,
      count(*) filter (where t='open')::int as opens,
      count(*) filter (where t='share')::int as shares,
      count(distinct v) filter (where at > now() - interval '5 minutes')::int as live
      from events where at > now() - make_interval(days => ${d})`,
    sql`select to_char(date_trunc('day', at), 'YYYY-MM-DD') as d,
      count(*) filter (where t='view')::int as views, count(*) filter (where t<>'view')::int as actions
      from events where at > now() - make_interval(days => ${d}) group by 1 order by 1`,
    sql`select k, max(title) as title,
      count(*) filter (where t in ('click','icon'))::int as clicks,
      count(*) filter (where t in ('copy','copylink','open','share'))::int as other,
      count(distinct v)::int as people
      from events where t<>'view' and k is not null and at > now() - make_interval(days => ${d})
      group by k order by count(*) desc limit 15`,
    sql`select v, min(at) as first_at, max(at) as last_at,
      count(*) filter (where t='view')::int as views, count(*) filter (where t<>'view')::int as actions,
      max(country) as country, max(city) as city, max(device) as device, max(os) as os, max(browser) as browser, max(ref) as ref
      from events where at > now() - make_interval(days => ${d}) group by v order by max(at) desc limit 30`,
    sql`select v, k, max(title) as title, count(*)::int as n from events
      where t<>'view' and k is not null and at > now() - make_interval(days => ${d}) group by v, k limit 5000`,
    sql`select 'ref' as g, coalesce(nullif(ref,''),'Direct') as x, count(distinct v)::int as n from events where t='view' and at > now() - make_interval(days => ${d}) group by 2
      union all select 'country', coalesce(nullif(country,''),'Unknown'), count(distinct v)::int from events where t='view' and at > now() - make_interval(days => ${d}) group by 2
      union all select 'device', coalesce(nullif(device,''),'Unknown'), count(distinct v)::int from events where t='view' and at > now() - make_interval(days => ${d}) group by 2
      union all select 'browser', coalesce(nullif(browser,''),'Unknown'), count(distinct v)::int from events where t='view' and at > now() - make_interval(days => ${d}) group by 2`,
    sql`select extract(hour from at)::int as h, count(*)::int as n from events where t='view' and at > now() - make_interval(days => ${d}) group by 1`,
  ]);

  const per = new Map<string, Map<string, { title: string; n: number }>>();
  const titles = new Map<string, string>();
  for (const r of acts) {
    const m = per.get(r.v) ?? new Map();
    m.set(r.k, { title: r.title || r.k, n: r.n });
    per.set(r.v, m);
    titles.set(r.k, r.title || r.k);
  }
  const dist = [0, 0, 0, 0];
  const combo = new Map<string, number>();
  for (const m of per.values()) {
    const keys = [...m.keys()].sort();
    dist[Math.min(keys.length, 4) - 1]++;
    if (keys.length >= 2) combo.set(keys.join("|"), (combo.get(keys.join("|")) ?? 0) + 1);
  }
  const groups = { ref: [], country: [], device: [], browser: [] } as Stats["groups"];
  for (const r of src) groups[r.g as keyof Stats["groups"]].push({ x: r.x, n: r.n });
  for (const g of Object.values(groups)) g.sort((a, b) => b.n - a.n).splice(8);
  const hours = Array(24).fill(0);
  for (const r of hrs) hours[r.h] = r.n;

  return {
    days: d, tot: tot[0] as Stats["tot"],
    daily: daily as Stats["daily"], top: top.map((r) => ({ ...r, title: r.title || r.k })) as Stats["top"],
    dist,
    combos: [...combo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => ({ titles: k.split("|").map((x) => titles.get(x) ?? x), n })),
    visitors: vis.map((r) => ({
      v: r.v, first: new Date(r.first_at).toISOString(), last: new Date(r.last_at).toISOString(), views: r.views, actions: r.actions,
      country: r.country ?? "", city: r.city ?? "", device: r.device ?? "", os: r.os ?? "", browser: r.browser ?? "", ref: r.ref ?? "",
      did: [...(per.get(r.v)?.values() ?? [])].sort((a, b) => b.n - a.n).slice(0, 6),
    })),
    groups, hours,
  };
}

export async function ignoreDevice() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  (await cookies()).set("ig", "1", { secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return `/api/ignore?t=${ignoreToken()}`;
}

export async function ignoreLink() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  return `/api/ignore?t=${ignoreToken()}`;
}

export async function clearStats() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await ensureSchema();
  await neon(process.env.DATABASE_URL!)`delete from events`;
}
