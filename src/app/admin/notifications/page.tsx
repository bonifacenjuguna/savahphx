import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notifications } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import NotificationManager from "@/components/NotificationManager";
import "../admin.css";

export const dynamic="force-dynamic";
export default async function AdminNotifications() {
  if(!(await isAdmin())) redirect("/admin");
  let items=[];
  try { await ensureSchema(); items=await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100); }
  catch(e){ console.error("[admin notifications]",e); }
  return <main className="adm"><div className="notice-admin-head"><a className="btn" href="/admin">← Dashboard</a><div><h1>Notifications</h1><p className="mut">Publish announcements, product updates and rich messages to your visitors.</p></div></div><NotificationManager initial={items.map(n=>({...n,createdAt:n.createdAt.toISOString(),updatedAt:n.updatedAt?.toISOString()??null,publishedAt:n.publishedAt?.toISOString()??null}))}/></main>;
}
