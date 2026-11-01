import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { links, notes, settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { fromDb } from "@/lib/rows";
import { fromDbNote } from "@/lib/notes";
import { normalize, type Layout, type Row } from "@/lib/theme";
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
  let rows, s, ns;
  try {
    await ensureSchema();
    [rows, s, ns] = await Promise.all([db.select().from(links).orderBy(asc(links.position)), db.select().from(settings), db.select().from(notes).orderBy(desc(notes.createdAt))]);
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
  const layouts = ((s.find((x) => x.id === 2)?.data as { layouts?: Layout[] } | undefined)?.layouts ?? []) as Layout[];
  return (
    <main className="adm">
      <Editor initial={initial} initialSettings={normalize(s.find((x) => x.id === 1)?.data)} initialLayouts={layouts} initialNotes={ns.map(fromDbNote)} />
    </main>
  );
}
