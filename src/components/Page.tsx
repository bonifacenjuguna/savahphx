import { logoUrl, type Row, type Settings } from "@/lib/theme";

const J = { left: "start", center: "center", right: "end" } as const;
const JC = { left: "flex-start", center: "center", right: "flex-end" } as const;
const AVR = { circle: "50%", rounded: "28%", square: "10px" } as const;

// Shared by the public page and the admin live preview.
export default function Page({ rows, t, embedded }: { rows: Row[]; t: Settings; embedded?: boolean }) {
  const allCards = rows.filter((r) => r.kind === "card");
  const cards = allCards.filter((r) => r.visible);
  const socials = rows.filter((r) => r.kind === "social" && r.visible).map((s) => {
    const c = allCards.find((x) => x.key === s.shortcutOf);
    return c ? { ...s, url: c.url, title: s.title || c.title, icon: s.icon || c.icon, image: s.image || c.image } : s;
  });
  const ink = t.text.slice(1);
  const pic = (r: Row, brand = false) => r.image || (r.icon ? logoUrl(r.icon, brand ? undefined : ink) : "");

  const bgCss =
    t.bgType === "gradient" ? `linear-gradient(160deg,${t.bg},${t.bg2})`
    : t.bgType === "mesh" ? `radial-gradient(55% 45% at 12% 8%,${t.accent}55,transparent 70%),radial-gradient(50% 45% at 92% 18%,${t.bg2},transparent 70%),radial-gradient(60% 50% at 50% 105%,${t.accent}33,transparent 70%),${t.bg}`
    : t.bg;

  const vars = {
    "--bg": t.bg, "--bg2": t.bg2, "--accent": t.accent, "--text": t.text, "--tint": t.glassTint,
    "--blur": `${t.glassBlur}px`, "--op": `${t.glassOpacity}%`, "--bd": `${t.glassBorder}%`, "--radius": `${t.radius}px`,
    "--av": `${t.avatarSize}px`, "--avr": AVR[t.avatarShape], "--aj": J[t.avatarPos], "--al": t.align, "--jc": JC[t.align],
    "--ts": `${t.titleSize}px`, "--bs": `${t.bioSize}px`, "--up": t.upper ? "uppercase" : "none", "--soc": `${t.socialSize}px`,
    "--dim": t.bgType === "image" ? t.bgDim / 100 : 0,
  } as React.CSSProperties;

  const nav = (bottom = false) =>
    socials.length ? (
      <nav className={`socials s-${t.socialStyle}${bottom ? " bot" : ""}`}>
        {socials.map((s) => (
          <a key={s.key} href={s.url} aria-label={s.title} target="_blank" rel="noopener noreferrer">
            {pic(s, t.socialStyle === "brand") && <img src={pic(s, t.socialStyle === "brand")} alt="" />}
          </a>
        ))}
      </nav>
    ) : null;

  const L = t.header;
  const bn = t.banner || (L === "hero" ? t.avatar : "");

  return (
    <div className={`pg${embedded ? " emb" : ""}${t.avatarGlow ? " glow" : ""}`}
      data-font={t.font} data-entrance={String(t.entrance)} data-hover={String(t.hover)} data-apos={t.avatarPos} style={vars}>
      <div className="bgfx" style={{ background: bgCss }}>
        {t.bgType === "image" && t.bgImage && <img className="bgi" src={t.bgImage} alt="" style={{ filter: `blur(${t.bgBlur}px)` }} />}
      </div>
      <main className="wrap">
        <header className={`hd hd-${L}`}>
          {L !== "classic" && <div className="bn">{bn && <img src={bn} alt="" />}</div>}
          <div className="sr">
            {L !== "hero" && (t.avatar ? <img className="av" src={t.avatar} alt="" /> : <div className="av" />)}
            <div className="tx">
              <h1>{t.title}</h1>
              {t.bio && <p className="bio">{t.bio}</p>}
            </div>
          </div>
          {t.socialPos !== "bottom" && nav()}
        </header>

        <section className="grid">
          {cards.map((c, i) => (
            <a key={c.key} className={`card ${c.width}`} style={{ "--i": i } as React.CSSProperties}
              href={c.url} target="_blank" rel="noopener noreferrer">
              {pic(c) && <img className="ico" src={pic(c)} alt="" />}
              <span>{c.title}</span>
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          ))}
        </section>
        {t.socialPos !== "top" && nav(true)}
      </main>
    </div>
  );
}
