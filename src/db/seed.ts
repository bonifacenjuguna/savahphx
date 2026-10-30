import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./index");
  const { links, settings } = await import("./schema");
  const { defaultSettings } = await import("../lib/theme");

  await db.delete(links);
  await db.insert(links).values([
    { kind: "social", title: "Instagram", url: "https://instagram.com/", icon: "instagram", position: 0 },
    { kind: "social", title: "WhatsApp", url: "https://wa.me/", icon: "whatsapp", position: 1 },
    { kind: "social", title: "TikTok", url: "https://tiktok.com/", icon: "tiktok", position: 2 },
    { kind: "social", title: "YouTube", url: "https://youtube.com/", icon: "youtube", position: 3 },
    { kind: "social", title: "Threads", url: "https://threads.net/", icon: "threads", position: 4 },
    { kind: "social", title: "Facebook", url: "https://facebook.com/", icon: "facebook", position: 5 },
    { kind: "social", title: "X", url: "https://x.com/", icon: "x", position: 6 },
    { kind: "card", title: "Instagram", url: "https://instagram.com/", icon: "instagram", width: "half", position: 0 },
    { kind: "card", title: "TikTok", url: "https://tiktok.com/", icon: "tiktok", width: "half", position: 1 },
    { kind: "card", title: "Chat with Savahphx (WhatsApp)", url: "https://wa.me/", icon: "whatsapp", position: 2 },
    { kind: "card", title: "Savah - Mobile Gaming & PUBG", url: "https://youtube.com/", icon: "youtube", position: 3 },
  ]);
  await db.insert(settings).values({ id: 1, data: defaultSettings }).onConflictDoNothing();
  console.log("Seeded.");
}
main();
