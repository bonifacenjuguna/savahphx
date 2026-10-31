import { byId, svgUri } from "@/lib/platforms";
import { effSizes, logoUrl, type Row, type Settings } from "@/lib/theme";
import CardMenu from "./CardMenu";

const J = { left: "start", center: "center", right: "end" } as const;
const JC = { left: "flex-start", center: "center", right: "flex-end" } as const;
const AVR = { circle: "50%", rounded: "28%", square: "10px" } as const;
const SHP = { circle: "50%", rounded: "30%", square: "8px" } as const;
const ext = (u: string) => (/^https?:/i.test(u) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const lum = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export const hasIcon = (r: Row) => { const p = byId(r.platform); return !!(r.image || r.icon || p?.slug || p?.svg); };

export function cssVars(t: Settings) {
  const light = lum(t.bg) > 0.55;
  return {
    "--bg": t.bg, "--bg2": t.bg2, "--accent": t.accent, "--text": t.text, "--tint": t.glassTint,
    "--nl": light ? "#ffffff" : mixHex(t.bg, "#ffffff", 0.09), "--nd": light ? mixHex(t.bg, "#000000", 0.18) : mixHex(t.bg, "#000000", 0.55),
    "--blur": `${t.glassBlur}px`, "--op": `${t.glassOpacity}%`, "--bd": `${t.glassBorder}%`, "--radius": `${t.radius}px`,
    "--av": `${t.avatarSize}px`, "--avr": AVR[t.avatarShape], "--aj": J[t.avatarPos], "--al": t.align, "--jc": JC[t.align],
    "--ts": `${t.titleSize}px`, "--bs": `${t.bioSize}px`, "--up": t.upper ? "uppercase" : "none", "--soc": `${t.socialSize}px`,
    "--dim": t.bgType === "image" ? t.bgDim / 100 : 0,
  } as React.CSSProperties;
}

// One logo, normal (text color) or colored (brand).
export function Ico({ r, ink, className }: { r: Row; ink: string; className?: string }) {
  const p = byId(r.platform);
  const slug = r.icon || p?.slug || "";
  const col = r.color ? p?.color ?? "#ffffff" : "#" + ink;
  if (r.image) return <img className={className} src={r.image} alt="" />;
  if (!r.icon && p?.svg) return <img className={className} src={svgUri(p.svg, col)} alt="" />;
  if (!slug) return null;
  if (!r.icon && p?.legacy)
    return <span className={`mk ${className ?? ""}`} style={{ "--m": `url(https://cdn.jsdelivr.net/npm/simple-icons@12/icons/${slug}.svg)`, background: col } as React.CSSProperties} />;
  return <img className={className} src={logoUrl(slug, r.color ? undefined : ink)} alt="" />;
}

export function CardIcon({ r, t }: { r: Row; t: Settings }) {
  if (!hasIcon(r)) return null;
  return (
    <span className={`icw${r.color ? " col" : ""}${r.image ? " img" : ""}`} style={{ "--r": SHP[r.shape || t.iconShape] } as React.CSSProperties}>
      <Ico r={r} ink={t.text.slice(1)} />
    </span>
  );
}

export function Chip({ s, t, inert }: { s: Row; t: Settings; inert?: boolean }) {
  const cls = `chip${t.socialStyle === "chip" ? " surf" : ""}${s.color ? " col" : ""}${s.image ? " img" : ""}`;
  const style = { "--r": SHP[s.shape || t.iconShape] } as React.CSSProperties;
  const body = <Ico r={s} ink={t.text.slice(1)} className="ci" />;
  return inert ? <span className={cls} style={style}>{body}</span>
    : <a className={cls} style={style} href={s.url} aria-label={s.title} {...ext(s.url)}>{body}</a>;
}

export function Powered({ t, inline }: { t: Settings; inline?: boolean }) {
  const cls = `pw surf pw-${inline ? "inline" : t.poweredPos}`;
  const inner = (
    <>
      {t.poweredLogo ? <img className="pwl" src={t.poweredLogo} alt="" /> : <svg className="pwl" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>}
      <span>{t.poweredText} {t.poweredName && <b>{t.poweredName}</b>}</span>
    </>
  );
  return t.poweredUrl && !inline ? <a className={cls} href={t.poweredUrl} {...ext(t.poweredUrl)}>{inner}</a> : <div className={cls}>{inner}</div>;
}

// Small themed box used by the admin to preview logos, photo and tag in place.
export function Mini({ t, children }: { t: Settings; children: React.ReactNode }) {
  return <div className={`pg mini${t.avatarGlow ? " glow" : ""}`} data-style={t.style} data-font={t.font} data-hover="false" data-entrance="false" style={{ ...cssVars(t), background: t.bg }}>{children}</div>;
}

// Shared by the public page and the admin live preview.
export default function Page({ rows, t, embedded }: { rows: Row[]; t: Settings; embedded?: boolean }) {
  const cards = rows.filter((r) => r.visible);
  const eff = effSizes(cards);
  const icons = rows.filter((r) => r.asIcon && r.url);
  const type = t.style === "neu" && t.bgType !== "image" ? "solid" : t.bgType;
  const bgCss =
    type === "gradient" ? `linear-gradient(160deg,${t.bg},${t.bg2})`
    : type === "mesh" ? `radial-gradient(55% 45% at 12% 8%,${t.accent}66,transparent 70%),radial-gradient(50% 50% at 90% 15%,${t.accent2}55,transparent 70%),radial-gradient(60% 55% at 20% 95%,${t.bg2},transparent 70%),radial-gradient(45% 40% at 85% 90%,${t.accent}33,transparent 70%),${t.bg}`
    : t.bg;

  const nav = (bottom = false) =>
    icons.length ? <nav className={`socials${bottom ? " bot" : ""}`}>{icons.map((s) => <Chip key={s.key} s={s} t={t} />)}</nav> : null;

  const L = t.header;
  const showAv = t.showAvatar && L !== "hero";
  const showBn = t.showBanner && L !== "classic";
  const bn = t.banner || (L === "hero" ? t.avatar : "");
  const hasText = (t.showName && !!t.name) || (t.showTitle && !!t.title) || (t.showBio && !!t.bio);
  const showHd = t.showHeader && (showBn || showAv || hasText);
  const topNav = t.socialPos === "top" || t.socialPos === "both" ? nav() : null;
  const botNav = t.socialPos === "bottom" || t.socialPos === "both" ? nav(true) : null;
  const pw = t.poweredShow && !!(t.poweredName || t.poweredText || t.poweredLogo);

  return (
    <div className={`pg${embedded ? " emb" : ""}${t.avatarGlow ? " glow" : ""}${pw && t.poweredPos === "corner" ? " pwc" : ""}`} data-style={t.style}
      data-font={t.font} data-entrance={String(t.entrance)} data-hover={String(t.hover)} data-apos={t.avatarPos} style={cssVars(t)}>
      <div className="bgfx" style={{ background: bgCss }}>
        {t.bgType === "image" && t.bgImage && <img className="bgi" src={t.bgImage} alt="" style={{ filter: `blur(${t.bgBlur}px)` }} />}
      </div>
      <main className={`wrap${showHd ? "" : " pt"}`}>
        {showHd ? (
          <header className={`hd hd-${L}${showAv ? "" : " noav"}`}>
            {showBn && <div className="bn">{bn && <img src={bn} alt="" />}</div>}
            <div className="sr">
              {showAv && (t.avatar ? <img className="av" src={t.avatar} alt="" /> : <div className="av" />)}
              {hasText && (
                <div className="tx">
                  {t.showName && t.name && <h2 className="nm">{t.name}</h2>}
                  {t.showTitle && t.title && <h1>{t.title}</h1>}
                  {t.showBio && t.bio && <p className="bio">{t.bio}</p>}
                </div>
              )}
            </div>
            {topNav}
          </header>
        ) : topNav && <div className="pad">{topNav}</div>}

        <section className="grid">
          {cards.map((c, i) => (
            <div key={c.key} className={`card surf ${eff[i]}`} style={{ "--i": i } as React.CSSProperties}>
              <a className="cl" href={c.url} aria-label={c.title} {...ext(c.url)}>
                <CardIcon r={c} t={t} />
                <span className="tt">{c.title}</span>
              </a>
              <CardMenu url={c.url} title={c.title} />
            </div>
          ))}
        </section>
        {botNav}
        {pw && t.poweredPos === "footer" && <Powered t={t} />}
      </main>
      {pw && t.poweredPos === "corner" && <Powered t={t} />}
    </div>
  );
}
