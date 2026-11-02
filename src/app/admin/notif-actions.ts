"use server";
import { neon } from "@neondatabase/serverless";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notifications } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { fromDbN } from "@/lib/notif-db";
import { cleanNotif, type Notif } from "@/lib/notifs";

const MAX_POSTS = 300;
const publish = () => { revalidatePath("/"); revalidatePath("/notifications"); };

// Posting is immediate (it does not wait for "Save changes"), like publishing a post.
export async function saveNotif(raw: Notif): Promise<Notif> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const n = cleanNotif(raw);
  if (!n.title) throw new Error("Add a title");
  if (n.publishAt && n.expiresAt && n.expiresAt <= n.publishAt) throw new Error("The end time must be after the start time");
  if (JSON.stringify(n.blocks).length > 90_000) throw new Error("This notification is too large");
  await ensureSchema();
  const have = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.uid, n.key)).limit(1);
  if (!have.length) {
    const [{ c }] = await db.select({ c: count() }).from(notifications);
    if (c >= MAX_POSTS) throw new Error(`You can keep up to ${MAX_POSTS} notifications. Delete some old ones first.`);
  }
  const now = new Date();
  // Going live with no start time means "now", so the date shown is when it was published.
  const start = n.publishAt ?? (n.status === "published" ? now.getTime() : null);
  const vals = {
    uid: n.key, title: n.title, summary: n.summary, kind: n.kind, color: n.color || null, image: n.image || null, blocks: n.blocks,
    cta: n.cta || null, ctaUrl: n.ctaUrl || null, pinned: n.pinned, quiet: n.quiet, status: n.status,
    publishAt: start ? new Date(start) : null, expiresAt: n.expiresAt ? new Date(n.expiresAt) : null, updatedAt: now, rev: n.rev,
  };
  const [row] = await db.insert(notifications).values({ ...vals, createdAt: have.length ? undefined : now })
    .onConflictDoUpdate({ target: notifications.uid, set: vals }).returning();
  publish();
  return fromDbN(row);
}

export async function deleteNotif(key: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await ensureSchema();
  await db.delete(notifications).where(eq(notifications.uid, String(key).slice(0, 64)));
  publish();
}

// "Notify again": everyone who already read it sees it as new once more, and it moves to the top of its day.
export async function renotify(key: string): Promise<Notif> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await ensureSchema();
  const [cur] = await db.select().from(notifications).where(eq(notifications.uid, String(key).slice(0, 64))).limit(1);
  if (!cur) throw new Error("Not found");
  const [row] = await db.update(notifications).set({ rev: Math.min(9999, cur.rev + 1), publishAt: new Date(), status: "published", updatedAt: new Date() }).where(eq(notifications.uid, cur.uid)).returning();
  publish();
  return fromDbN(row);
}

export type NStat = { opens: number; clicks: number };
// How many visitors opened each notification, and how many used a button or link inside it.
export async function notifStats(): Promise<Record<string, NStat>> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await ensureSchema();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`select k, count(distinct v) filter (where t='nview')::int as opens, count(*) filter (where t='nclick')::int as clicks
    from events where t in ('nview','nclick') and k is not null group by k`;
  return Object.fromEntries(rows.map((r) => [r.k as string, { opens: r.opens as number, clicks: r.clicks as number }]));
}
