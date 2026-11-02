import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import Page from "@/components/Page";
import Track from "@/components/Track";
import { loadLive } from "@/lib/notif-db";
import { fromDb } from "@/lib/rows";
import type { Notif } from "@/lib/notifs";
import { defaultSettings, normalize, type Row } from "@/lib/theme";

// Static page; the admin calls revalidatePath("/") after each save.
export const dynamic = "force-static";

async function load() {
  try {
    await ensureSchema();
    const [r, s, n] = await Promise.all([db.select().from(links).orderBy(asc(links.position)), db.select().from(settings), loadLive().catch(() => [] as Notif[])]);
    return { rows: fromDb(r), t: normalize(s.find((x) => x.id === 1)?.data), notifs: n };
  } catch (e) {
    console.error("[bio] load failed:", e);
    return { rows: [] as Row[], t: defaultSettings, notifs: [] as Notif[] };
  }
}

export async function generateViewport() {
  const { t } = await load();
  return { themeColor: t.bg };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await load();
  const desc = t.title || t.bio.split("\n")[0] || "All my links in one place.";
  const title = t.name || t.title;
  return { title, description: desc, openGraph: { title, description: desc, images: t.avatar ? [t.avatar] : [] } };
}

export default async function Home() {
  const { rows, t, notifs } = await load();
  return <><style>{`html,body{background:${t.bg}}`}</style><Page rows={rows} t={t} notifs={notifs} /><Track /></>;
}
