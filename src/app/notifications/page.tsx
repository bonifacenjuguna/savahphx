import type { Metadata } from "next";
import NotificationInbox from "@/components/NotificationInbox";
import { ensureSchema } from "@/db/ensure";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", description: "Updates and announcements." };

export default async function NotificationsPage() {
  let items = [];
  try {
    await ensureSchema();
    items = await db.select({ id: notifications.id, title: notifications.title, excerpt: notifications.excerpt, body: notifications.body, image: notifications.image, category: notifications.category, pinned: notifications.pinned, publishedAt: notifications.publishedAt })
      .from(notifications).where(eq(notifications.status, "published"))
      .orderBy(desc(notifications.pinned), desc(notifications.publishedAt), desc(notifications.createdAt)).limit(100);
  } catch (e) { console.error("[notifications page]", e); }
  return <NotificationInbox initial={items} />;
}
