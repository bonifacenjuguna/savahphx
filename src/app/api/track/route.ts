import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { ensureSchema } from "@/db/ensure";
import { isAdmin } from "@/lib/auth";

const TYPES = new Set(["view", "click", "icon", "copy", "copylink", "open", "share"]);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram|discord|curl|python|node-fetch|axios/i;
const seen = new Map<string, { n: number; t: number }>();
const ok = () => new Response(null, { status: 204 });

function ua(s: string) {
  const app = /Instagram/i.test(s) ? "Instagram app" : /FBAN|FBAV/i.test(s) ? "Facebook app" : /musical_ly|TikTok|Bytedance/i.test(s) ? "TikTok app" : /Line\//i.test(s) ? "LINE app" : "";
  const browser = app || (/Edg\//i.test(s) ? "Edge" : /OPR\/|Opera/i.test(s) ? "Opera" : /SamsungBrowser/i.test(s) ? "Samsung" : /Firefox\//i.test(s) ? "Firefox" : /Chrome\//i.test(s) ? "Chrome" : /Safari\//i.test(s) ? "Safari" : "Other");
  const os = /Windows/i.test(s) ? "Windows" : /Android/i.test(s) ? "Android" : /iPhone|iPad|iPod/i.test(s) ? "iOS" : /Mac OS X/i.test(s) ? "macOS" : /Linux/i.test(s) ? "Linux" : "Other";
  const device = /iPad|Tablet/i.test(s) ? "Tablet" : /Mobi|Android|iPhone/i.test(s) ? "Mobile" : "Desktop";
  return { browser, os, device };
}

export async function POST(req: Request) {
  try {
    // Never record you: an admin session or a device marked as ignored.
    if ((await isAdmin()) || (await cookies()).get("ig")) return ok();
    const agent = req.headers.get("user-agent") ?? "";
    if (BOT.test(agent)) return ok();
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) return new Response(null, { status: 403 });

    const b = (await req.json()) as Record<string, unknown>;
    const t = String(b.t ?? "");
    const v = String(b.v ?? "");
    if (!TYPES.has(t) || !/^[\w-]{8,64}$/.test(v)) return ok();
    const k = typeof b.k === "string" && /^[\w-]{1,64}$/.test(b.k) ? b.k : null;
    if (t !== "view" && !k) return ok();

    const now = Date.now();
    const h = seen.get(v);
    if (h && now - h.t < 60_000) { if (h.n >= 40) return ok(); h.n++; } else seen.set(v, { n: 1, t: now });
    if (seen.size > 5000) seen.clear();

    let ref = "";
    try { if (typeof b.ref === "string" && b.ref) ref = new URL(b.ref).host.replace(/^www\./, ""); } catch {}
    if (ref === req.headers.get("host")) ref = "";
    const title = typeof b.title === "string" ? b.title.slice(0, 80) : null;
    const lang = typeof b.lang === "string" ? b.lang.slice(0, 12) : null;
    const country = req.headers.get("x-vercel-ip-country");
    let city: string | null = null;
    try { city = decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "") || null; } catch {}
    const { browser, os, device } = ua(agent);

    await ensureSchema();
    const sql = neon(process.env.DATABASE_URL!);
    await sql`insert into events (t, k, title, v, country, city, device, os, browser, ref, lang)
      values (${t}, ${k}, ${title}, ${v}, ${country}, ${city}, ${device}, ${os}, ${browser}, ${ref || null}, ${lang})`;
    if (Math.random() < 0.01) await sql`delete from events where at < now() - interval '180 days'`;
  } catch {}
  return ok();
}
