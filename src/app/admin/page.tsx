import { asc } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { fromDb } from "@/lib/rows";
import { normalize, type Row } from "@/lib/theme";
import { login } from "./actions";
import Editor from "./editor";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!(await isAdmin())) {
    const { e } = await searchParams;
    const msg = e === "2" ? "Too many attempts. Try again later." : e === "3" ? "Server not configured." : e ? "Wrong password." : "";
    return (
      <main className="adm login">
        <form action={login}>
          <h1>Admin</h1>
          <input name="password" type="password" placeholder="Password" required autoFocus autoComplete="current-password" />
          <button className="btn pri">Sign in</button>
          {msg && <p className="err">{msg}</p>}
        </form>
      </main>
    );
  }
  let rows, s;
  try {
    await ensureSchema();
    [rows, s] = await Promise.all([db.select().from(links).orderBy(asc(links.position)), db.select().from(settings)]);
  } catch (e) {
    console.error("[admin] load failed:", e);
    return (
      <main className="adm">
        <h1>Admin</h1>
        <p className="err">Database error: {e instanceof Error ? e.message : String(e)}</p>
        <p>Check that DATABASE_URL is set for this environment in Vercel, then redeploy.</p>
      </main>
    );
  }
  const initial: Row[] = fromDb(rows);
  return (
    <main className="adm">
      <Editor initial={initial} initialSettings={normalize(s[0]?.data)} />
    </main>
  );
}
