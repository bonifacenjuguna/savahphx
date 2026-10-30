import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, settings } from "@/db/schema";
import { defaultSettings, logoUrl } from "@/lib/theme";

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
  const socialLinks = (
    <nav className="socials" aria-label="Social links">
      {socials.map((s) => (
        <a key={s.id} href={s.url} aria-label={s.title} title={s.title} target="_blank" rel="noopener noreferrer">
          {src(s) ? <img src={src(s)!} alt="" /> : <span className="social-fallback">{s.title.slice(0, 1)}</span>}
        </a>
      ))}
    </nav>
  );

  return (
    <main
      className="page"
      data-entrance={String(t.entrance)}
      data-hover={String(t.hover)}
      data-layout={t.profileLayout}
      data-header={t.headerStyle}
      data-avatar={t.avatarPosition}
      style={{
        "--accent": t.accent, "--bg": t.bg, "--radius": `${t.radius}px`,
        "--blur": `${t.blur}px`,
        backgroundImage: t.backgroundImage ? `linear-gradient(180deg, rgba(5,9,15,.70), rgba(5,9,15,.88)), url("${t.backgroundImage}")` : undefined,
      } as React.CSSProperties}
    >
      <section className="profile-shell">
        {t.banner && <div className="banner" style={{ backgroundImage: `linear-gradient(180deg,rgba(5,9,15,.12),rgba(5,9,15,.82)),url("${t.banner}")` }} />}
        <header className="profile">
          <div className="avatar-wrap">
            {t.avatar ? <img className="avatar" src={t.avatar} alt="Profile" /> : <div className="avatar avatar-empty" aria-hidden="true" />}
          </div>
          <div className="identity">
            <h1>{t.name}</h1>
            {t.bio && <p className="bio">{t.bio}</p>}
            {t.uid && <p className="uid">{t.uid}</p>}
          </div>
          {t.socialsPosition === "top" && socialLinks}
        </header>
        {t.socialsPosition === "bottom" && <div className="socials-bottom">{socialLinks}</div>}
      </section>

      <section className="links-grid" aria-label="Links">
        {cards.map((c, i) => (
          <a
            key={c.id}
            className={`link-card ${c.width}`}
            style={{ "--i": i } as React.CSSProperties}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {src(c) ? <img className="link-icon" src={src(c)!} alt="" /> : <span className="link-icon-fallback">{c.title.slice(0, 1)}</span>}
            <span className="link-title">{c.title}</span>
            <span className="link-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </section>
      <footer className="site-footer">Made with care</footer>
    </main>
  );
}
