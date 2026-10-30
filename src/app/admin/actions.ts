"use server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import { isAdmin, makeToken, safeEq } from "@/lib/auth";
import { normalize, type Row, type Settings } from "@/lib/theme";

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
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete("admin");
  redirect("/admin");
}

export async function upload(fd: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const f = fd.get("file");
  if (!(f instanceof File) || !f.type.startsWith("image/") || f.size > 4e6) throw new Error("Bad file");
  const { url } = await put(`img/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`, f, { access: "public" });
  return url;
}

export async function saveAll(p: { rows: Row[]; settings: Settings }) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const okUrl = (u: string) => /^(https?:\/\/|mailto:|tel:)/i.test(u);
  const okImg = (u: string) => /^https:\/\//i.test(u);
  const cardKeys = new Set(p.rows.filter((r) => r.kind === "card").map((r) => r.key));
  const pos = { card: 0, social: 0 };

  const vals = p.rows.map((r) => {
    const kind = r.kind === "social" ? "social" : "card";
    const sc = kind === "social" && cardKeys.has(r.shortcutOf) ? r.shortcutOf : null;
    const target = sc ? p.rows.find((x) => x.key === sc) : undefined;
    const url = (target?.url ?? r.url).trim();
    const title = (r.title.trim() || target?.title || "").slice(0, 80);
    if (!title || !okUrl(url)) throw new Error("Bad link");
    return {
      kind, title, url,
      icon: /^[a-z0-9]+$/.test(r.icon) ? r.icon : null,
      image: okImg(r.image) ? r.image : null,
      width: r.width === "half" ? "half" : "full",
      position: pos[kind]++, visible: !!r.visible,
      uid: String(r.key).replace(/[^\w-]/g, "").slice(0, 64) || crypto.randomUUID(),
      shortcutOf: sc,
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
