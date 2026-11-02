import { config } from "dotenv";
config({ path: ".env.local" });

// Runs on every build but only ever acts on a brand-new deployment (no saved settings yet).
// Once your site has settings, this does nothing: your name, bio, links and design are never touched,
// even if you deleted every link on purpose.
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const { db } = await import("./index");
  const { ensureSchema } = await import("./ensure");
  const { eq } = await import("drizzle-orm");
  const { links, settings } = await import("./schema");
  const { defaultSettings } = await import("../lib/theme");
  await ensureSchema();
  const saved = await db.select({ id: settings.id }).from(settings).where(eq(settings.id, 1)).limit(1);
  if (saved.length) { console.log("Existing site found, nothing to seed."); return; }
  const have = await db.select({ id: links.id }).from(links).limit(1);
  if (!have.length) {
    await db.insert(links).values([
      { kind: "card", type: "link", platform: "instagram", handle: "johndoe", title: "Instagram", url: "https://instagram.com/johndoe", width: "half", position: 0, uid: "demo-instagram", asIcon: true },
      { kind: "card", type: "link", platform: "tiktok", handle: "johndoe", title: "TikTok", url: "https://www.tiktok.com/@johndoe", width: "half", position: 1, uid: "demo-tiktok", asIcon: true },
      { kind: "card", type: "link", platform: "whatsapp", handle: "254700000000", title: "Chat on WhatsApp", url: "https://wa.me/254700000000", position: 2, uid: "demo-whatsapp", asIcon: true },
      { kind: "card", type: "link", platform: "youtube", handle: "johndoe", title: "My YouTube channel", url: "https://www.youtube.com/@johndoe", position: 3, uid: "demo-youtube", asIcon: true },
      { kind: "card", type: "text", title: "Business inquiries", body: "hello@example.com", url: "", position: 4, uid: "demo-note" },
    ]);
  }
  await db.insert(settings).values({ id: 1, data: defaultSettings }).onConflictDoNothing();
  console.log("Fresh site seeded with John Doe examples.");
}
main();
