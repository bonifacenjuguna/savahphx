"use server";
import { neon } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notes } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { cleanNote, fromDbNote, SAMPLES, type Note } from "@/lib/notes";

const guard = async () => { if (!(await isAdmin())) throw new Error("Unauthorized"); await ensureSchema(); };
const cols = (n: Note) => ({
  title: n.title, body: n.body, kind: n.kind, emoji: n.emoji, images: n.images, ctaLabel: n.ctaLabel, ctaUrl: n.ctaUrl, accent: n.accent,
  pinned: n.pinned, popup: n.popup, status: n.status, publishAt: n.publishAt ? new Date(n.publishAt) : null, expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
});
const uid = () => "n" + crypto.randomUUID().replace(/-/g, "").slice(0, 10);

export async function listNotes(): Promise<Note[]> {
  await guard();
  return (await db.select().from(notes).orderBy(desc(notes.createdAt))).map(fromDbNote);
}

// bump = show it as new again to people who already read it
export async function saveNote(raw: Note, bump: boolean): Promise<Note> {
  await guard();
  const n = cleanNote(raw);
  if (!n.title && !n.body.trim() && !n.images.length) throw new Error("Add a title, some text or an image first.");
  if (n.ctaLabel && !n.ctaUrl) throw new Error("The button needs a link that starts with https://");
  if (n.publishAt && n.expiresAt && n.expiresAt <= n.publishAt) throw new Error("The end time must be after the start time.");
  let out;
  if (n.key) {
    const [r] = await db.update(notes).set({ ...cols(n), ...(bump ? { rev: new Date() } : {}) }).where(eq(notes.uid, n.key)).returning();
    if (!r) throw new Error("That post no longer exists.");
    out = r;
  } else {
    [out] = await db.insert(notes).values({ uid: uid(), ...cols(n) }).returning();
  }
  revalidatePath("/");
  return fromDbNote(out);
}

export async function deleteNote(key: string) {
  await guard();
  await db.delete(notes).where(eq(notes.uid, key));
  revalidatePath("/");
}

export async function addSamples(): Promise<Note[]> {
  await guard();
  for (const s of [...SAMPLES].reverse()) {
    const n = cleanNote({ ...s, status: "published" });
    await db.insert(notes).values({ uid: uid(), ...cols(n) });
  }
  revalidatePath("/");
  return listNotes();
}

// How many people opened each post and tapped its button.
export async function noteStats(): Promise<Record<string, { opens: number; clicks: number }>> {
  await guard();
  const sql = neon(process.env.DATABASE_URL!);
  const r = (await sql`select k, count(distinct v) filter (where t='note')::int as opens, count(*) filter (where t='noteclick')::int as clicks
    from events where t in ('note','noteclick') and k is not null group by k`) as { k: string; opens: number; clicks: number }[];
  return Object.fromEntries(r.map((x) => [x.k, { opens: x.opens, clicks: x.clicks }]));
}
