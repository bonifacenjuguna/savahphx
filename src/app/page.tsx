import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, settings } from "@/db/schema";
import { defaultSettings, logoUrl } from "@/lib/theme";

// Static page; the admin calls revalidatePath("/") after each save.
export const dynamic = "force-static";

async function load() {
  try {
    const [rows, s] = await Promise.all([
      db.select().from(links).where(eq(links.visible, true)).orderBy(asc(links.position)),
      db.select().from(settings).where(eq(settings.id, 1)),
    ]);
    return { rows, t: { ...defaultSettings, ...s[0]?.data } };
  } catch {
    return { rows: [], t: defaultSettings };
  }
}

export default async function Home() {
  const { rows, t } = await load();
  const socials = rows.filter((r) => r.kind === "social");
  const cards = rows.filter((r) => r.kind === "card");
  const src = (r: (typeof rows)[number]) => r.image || (r.icon ? logoUrl(r.icon) : null);

  return (
    <main
      className="page"
      data-entrance={String(t.entrance)}
      data-hover={String(t.hover)}
      style={{ "--accent": t.accent, "--bg": t.bg, "--radius": `${t.radius}px`, "--blur": `${t.blur}px` } as React.CSSProperties}
    >
      <header>
        {t.avatar ? <img className="avatar" src={t.avatar} alt="" /> : <div className="avatar" />}
        <h1>{t.name}</h1>
        <p>{t.uid}</p>
        <nav className="socials">
          {socials.map((s) => (
            <a key={s.id} href={s.url} aria-label={s.title} target="_blank" rel="noopener noreferrer">
              {src(s) && <img src={src(s)!} alt="" />}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid">
        {cards.map((c, i) => (
          <a
            key={c.id}
            className={`card ${c.width}`}
            style={{ "--i": i } as React.CSSProperties}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {src(c) && <img className="ico" src={src(c)!} alt="" />}
            <span>{c.title}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
