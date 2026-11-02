import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notifications } from "@/db/schema";
import { cleanBlocks, KINDS, liveAt, sortN, type KindId, type Notif } from "./notifs";

type Row = typeof notifications.$inferSelect;

export const fromDbN = (r: Row): Notif => ({
  key: r.uid, title: r.title, summary: r.summary ?? "", kind: (KINDS.some((k) => k.id === r.kind) ? r.kind : "info") as KindId,
  color: r.color ?? "", image: r.image ?? "", blocks: cleanBlocks(r.blocks), cta: r.cta ?? "", ctaUrl: r.ctaUrl ?? "",
  pinned: r.pinned, quiet: r.quiet, status: r.status === "draft" ? "draft" : "published",
  publishAt: r.publishAt ? r.publishAt.getTime() : null, expiresAt: r.expiresAt ? r.expiresAt.getTime() : null,
  createdAt: r.createdAt.getTime(), updatedAt: r.updatedAt.getTime(), rev: r.rev,
});

// What visitors can see right now (published, started, not expired), pinned first and newest first.
export async function loadLive(): Promise<Notif[]> {
  await ensureSchema();
  const rows = await db.select().from(notifications).where(eq(notifications.status, "published"));
  const now = Date.now();
  return rows.map(fromDbN).filter((n) => liveAt(n, now)).sort(sortN).slice(0, 60);
}

// Everything, for the dashboard.
export async function loadAll(): Promise<Notif[]> {
  const rows = await db.select().from(notifications);
  return rows.map(fromDbN).sort(sortN);
}
