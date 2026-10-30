import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import Page from "@/components/Page";
import { defaultSettings, normalize, type Row } from "@/lib/theme";

// Static page; the admin calls revalidatePath("/") after each save.
export const dynamic = "force-static";

async function load() {
  try {
    await ensureSchema();
    const [r, s] = await Promise.all([db.select().from(links).orderBy(asc(links.position)), db.select().from(settings)]);
    const rows: Row[] = r.map((x) => ({
      key: x.uid ?? `id-${x.id}`, kind: x.kind === "social" ? "social" : "card", title: x.title, url: x.url,
      icon: x.icon ?? "", image: x.image ?? "", width: x.width === "half" ? "half" : "full",
      visible: x.visible, shortcutOf: x.shortcutOf ?? "",
    }));
    return { rows, t: normalize(s[0]?.data) };
  } catch (e) {
    console.error("[bio] load failed:", e);
    return { rows: [] as Row[], t: defaultSettings };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await load();
  const desc = t.bio.split("\n")[0] || "All my links in one place.";
  return { title: t.title, description: desc, openGraph: { title: t.title, description: desc, images: t.avatar ? [t.avatar] : [] } };
}

export default async function Home() {
  const { rows, t } = await load();
  return <Page rows={rows} t={t} />;
}
