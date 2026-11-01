import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notifications } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const items = await db.select({
      id: notifications.id, title: notifications.title, excerpt: notifications.excerpt,
      body: notifications.body, image: notifications.image, category: notifications.category,
      pinned: notifications.pinned, publishedAt: notifications.publishedAt,
    }).from(notifications).where(eq(notifications.status, "published")).orderBy(desc(notifications.pinned), desc(notifications.publishedAt), desc(notifications.createdAt)).limit(100);
    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[notifications] load failed", error);
    return NextResponse.json({ items: [], error: "Notifications are temporarily unavailable." }, { status: 503 });
  }
}
