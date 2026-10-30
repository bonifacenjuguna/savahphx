import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, settings } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { defaultSettings, type Row } from "@/lib/theme";
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
  const [rows, s] = await Promise.all([
    db.select().from(links).orderBy(asc(links.position)),
    db.select().from(settings).where(eq(settings.id, 1)),
  ]);
  const initial: Row[] = rows.map((r) => ({
    key: String(r.id), kind: r.kind as Row["kind"], title: r.title, url: r.url,
    icon: r.icon ?? "", image: r.image ?? "", width: r.width as Row["width"], visible: r.visible,
  }));
  return (
    <main className="adm">
      <Editor initial={initial} initialSettings={{ ...defaultSettings, ...s[0]?.data }} />
    </main>
  );
}
