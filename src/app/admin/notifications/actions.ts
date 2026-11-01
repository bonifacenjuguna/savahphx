"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notifications } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function saveNotification(input: {id?:number;title:string;excerpt:string;body:string;image:string;category:string;status:"draft"|"published";pinned:boolean}) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const title=String(input.title||"").trim().slice(0,120), body=String(input.body||"").trim().slice(0,12000);
  if(!title||!body) throw new Error("A title and message are required.");
  const image=/^https:\/\//i.test(input.image)?input.image:"";
  const values={title,excerpt:String(input.excerpt||"").trim().slice(0,240),body,image,category:String(input.category||"Update").trim().slice(0,32),status:input.status==="published"?"published":"draft",pinned:!!input.pinned,updatedAt:new Date(),publishedAt:input.status==="published"?new Date():null};
  await ensureSchema();
  if(input.id) await db.update(notifications).set(values).where(eq(notifications.id,input.id));
  else await db.insert(notifications).values(values);
  revalidatePath("/"); revalidatePath("/notifications"); revalidatePath("/admin/notifications");
}
export async function deleteNotification(id:number) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await ensureSchema(); await db.delete(notifications).where(eq(notifications.id,id));
  revalidatePath("/notifications"); revalidatePath("/admin/notifications");
}
