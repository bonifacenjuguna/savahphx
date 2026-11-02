import type { Metadata } from "next";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { settings } from "@/db/schema";
import { Bg, bgOnImage, cssVars } from "@/components/Page";
import NotifPage from "@/components/NotifCenter";
import { loadLive } from "@/lib/notif-db";
import type { Notif } from "@/lib/notifs";
import { defaultSettings, normalize } from "@/lib/theme";

// Refreshed at most every 30 seconds; the page also asks the server for a fresh list as soon as it opens.
export const revalidate = 30;

async function load() {
  try {
    await ensureSchema();
    const [s, n] = await Promise.all([db.select().from(settings), loadLive()]);
    return { t: normalize(s.find((x) => x.id === 1)?.data), notifs: n };
  } catch (e) {
    console.error("[bio] notifications load failed:", e);
    return { t: defaultSettings, notifs: [] as Notif[] };
  }
}

export async function generateViewport() {
  const { t } = await load();
  return { themeColor: t.bg };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await load();
  return { title: `${t.bellLabel}${t.name ? ` · ${t.name}` : ""}`, robots: { index: false, follow: true } };
}

export default async function Notifications() {
  const { t, notifs } = await load();
  return (
    <>
      <style>{`html,body{background:${t.bg}}`}</style>
      <div className={`pg nc-pg${t.avatarGlow ? " glow" : ""}`} data-style={t.style} data-bgi={bgOnImage(t) ? "on" : "off"} data-font={t.font}
        data-en={t.entrance ? t.entranceStyle : "none"} data-hv={t.hover ? t.hoverStyle : "none"} data-am="none" data-apos={t.avatarPos} style={cssVars(t)}>
        <Bg t={t} />
        <main className="wrap pt"><NotifPage t={t} initial={notifs} /></main>
      </div>
    </>
  );
}
