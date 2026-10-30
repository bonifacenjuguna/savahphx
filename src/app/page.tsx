import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { links, settings } from "@/db/schema";
import { BrandIcon } from "@/lib/platform-icons";
import { defaultSettings } from "@/lib/theme";

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
  const cards = rows.filter((r) => r.kind === "card");
  // Shortcuts are never a separate/default link collection: they are generated
  // exclusively from visible cards explicitly marked as shortcuts in the Admin.
  const shortcuts = cards.filter((r) => r.shortcut && (r.icon || r.image) && r.url);
  const cardMark = (r: (typeof cards)[number], size = 30) =>
    r.image ? <img className="link-icon" src={r.image} alt="" /> :
    r.icon ? <BrandIcon slug={r.icon} size={size} /> :
    <span className="link-icon-fallback">{r.title.slice(0, 1)}</span>;
  const shortcutLinks = (
    <nav className="socials" aria-label="Profile shortcuts">
      {shortcuts.map((item) => (
        <a key={item.id} href={item.url} aria-label={item.title} title={item.title} target="_blank" rel="noopener noreferrer">
          {item.image ? <img src={item.image} alt="" /> : item.icon ? <BrandIcon slug={item.icon} size={28} /> : null}
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
        "--page-bg-image": t.backgroundImage ? `url("${t.backgroundImage}")` : "none",
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
          {t.socialsPosition === "top" && shortcuts.length > 0 && shortcutLinks}
        </header>
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
            {cardMark(c)}
            <span className="link-title">{c.title}</span>
          </a>
        ))}
      </section>
      {t.socialsPosition === "bottom" && shortcuts.length > 0 && <div className="socials-bottom">{shortcutLinks}</div>}
      <footer className="site-footer">Made with care</footer>
    </main>
  );
}
