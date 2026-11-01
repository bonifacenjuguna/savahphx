"use server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import { isAdmin, makeToken, safeEq } from "@/lib/auth";
import { byId, resolveUrl } from "@/lib/platforms";
import { cleanRow } from "@/lib/rows";
import { netById } from "@/lib/crypto";
import { normalize, type Layout, type Row, type Settings } from "@/lib/theme";

// Best-effort brute-force limit (per server instance).
const hits = new Map<string, { n: number; t: number }>();

export async function login(fd: FormData) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !process.env.SESSION_SECRET) redirect("/admin?e=3");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "x";
  const now = Date.now();
  const h = hits.get(ip);
  const live = h && now - h.t < 15 * 60e3 ? h : undefined;
  if (live && live.n >= 5) redirect("/admin?e=2");
  if (!safeEq(String(fd.get("password") ?? ""), pw)) {
    hits.set(ip, { n: (live?.n ?? 0) + 1, t: live?.t ?? now });
    await new Promise((r) => setTimeout(r, 800));
    redirect("/admin?e=1");
  }
  hits.delete(ip);
  (await cookies()).set("admin", makeToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: 7 * 86400,
  });
  // Keeps this device out of your stats even after the admin session ends.
  (await cookies()).set("ig", "1", { secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete("admin");
  redirect("/admin");
}

export async function saveAll(p: { rows: Row[]; settings: Settings }) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const okImg = (u: string) => /^https:\/\//i.test(u);
  const vals = p.rows.map((raw, i) => {
    const r = cleanRow(raw);
    const title = r.title.trim().slice(0, 80);
    let url = "";
    let body: string | null = null;
    if (r.type === "link") {
      const x = resolveUrl(byId(r.platform), r.handle, r.url);
      if (x.error) throw new Error("Invalid link");
      url = x.url;
    } else {
      body = r.body.trim().slice(0, r.type === "text" ? 1000 : 300);
      if (!body) throw new Error("Empty card");
    }
    if (!title) throw new Error("Missing title");
    const link = r.type === "link";
    const pl = link ? byId(r.platform) : undefined;
    return {
      kind: "card", title, url, type: r.type, body,
      icon: link && /^[a-z0-9]+$/.test(r.icon) ? r.icon : null, image: link && okImg(r.image) ? r.image : null,
      width: r.size, tall: r.tall, position: i, visible: r.visible, uid: r.key.slice(0, 64), shortcutOf: null,
      platform: link ? pl?.id ?? "custom" : null, handle: pl && pl.kind !== "url" ? r.handle.trim().slice(0, 200) : null,
      network: r.type === "wallet" ? (netById(r.network) ? r.network : "custom") : null,
      memo: r.type === "wallet" ? r.memo.trim().slice(0, 80) : null, qr: r.qr,
      asIcon: link && r.asIcon, color: r.color, shape: r.shape || null,
    };
  });
  await ensureSchema();
  const data = normalize(p.settings);
  const ops: unknown[] = [db.delete(links)];
  if (vals.length) ops.push(db.insert(links).values(vals));
  ops.push(db.insert(settings).values({ id: 1, data }).onConflictDoUpdate({ target: settings.id, set: { data } }));
  await db.batch(ops as [never, ...never[]]); // atomic
  revalidatePath("/");
}

export async function saveLayouts(list: Layout[]) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const layouts = list.slice(0, 20).map((l) => ({
    id: String(l.id).replace(/[^\w-]/g, "").slice(0, 64) || crypto.randomUUID(),
    name: String(l.name).trim().slice(0, 40) || "Untitled", at: Number(l.at) || Date.now(),
    s: normalize(l.s), rows: Array.isArray(l.rows) ? l.rows.slice(0, 80).map(cleanRow) : undefined,
  }));
  if (JSON.stringify(layouts).length > 400_000) throw new Error("Too large");
  await ensureSchema();
  const data = { layouts };
  await db.insert(settings).values({ id: 2, data }).onConflictDoUpdate({ target: settings.id, set: { data } });
}
