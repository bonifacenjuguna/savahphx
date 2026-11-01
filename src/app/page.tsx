import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import Page from "@/components/Page";
import Track from "@/components/Track";
import { fromDb } from "@/lib/rows";
import { defaultSettings, normalize, type Row } from "@/lib/theme";

// Static page; the admin calls revalidatePath("/") after each save.
export const dynamic = "force-static";

async function load() {
  try {
    await ensureSchema();
    const [r, s] = await Promise.all([db.select().from(links).orderBy(asc(links.position)), db.select().from(settings)]);
    return { rows: fromDb(r), t: normalize(s.find((x) => x.id === 1)?.data) };
  } catch (e) {
    console.error("[bio] load failed:", e);
    return { rows: [] as Row[], t: defaultSettings };
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
  const { rows, t } = await load();
  return <><style>{`html,body{background:${t.bg}}`}</style><Page rows={rows} t={t} /><Track /></>;
}
