import { byId, svgUri } from "@/lib/platforms";
import { effSizes, logoUrl, type Row, type Settings } from "@/lib/theme";
import CardMenu from "./CardMenu";

const J = { left: "start", center: "center", right: "end" } as const;
const JC = { left: "flex-start", center: "center", right: "flex-end" } as const;
const AVR = { circle: "50%", rounded: "28%", square: "10px" } as const;
const SHP = { circle: "50%", rounded: "30%", square: "8px" } as const;

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const lum = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export const hasIcon = (r: Row) => { const p = byId(r.platform); return !!(r.image || r.icon || p?.slug || p?.svg); };

// One logo, in the normal (text color) or colored (brand) version.
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

// Shared by the public page and the admin live preview.
export default function Page({ rows, t, embedded }: { rows: Row[]; t: Settings; embedded?: boolean }) {
  const ink = t.text.slice(1);
  const cards = rows.filter((r) => r.visible);
  const eff = effSizes(cards);
  const icons = rows.filter((r) => r.asIcon && r.url);
  const light = lum(t.bg) > 0.55;
  const nl = light ? "#ffffff" : mixHex(t.bg, "#ffffff", 0.09);
  const nd = light ? mixHex(t.bg, "#000000", 0.18) : mixHex(t.bg, "#000000", 0.55);
  const type = t.style === "neu" && t.bgType !== "image" ? "solid" : t.bgType;
  const bgCss =
    type === "gradient" ? `linear-gradient(160deg,${t.bg},${t.bg2})`
    : type === "mesh" ? `radial-gradient(55% 45% at 12% 8%,${t.accent}66,transparent 70%),radial-gradient(50% 50% at 90% 15%,${t.accent2}55,transparent 70%),radial-gradient(60% 55% at 20% 95%,${t.bg2},transparent 70%),radial-gradient(45% 40% at 85% 90%,${t.accent}33,transparent 70%),${t.bg}`
    : t.bg;

  const vars = {
    "--bg": t.bg, "--bg2": t.bg2, "--accent": t.accent, "--text": t.text, "--tint": t.glassTint, "--nl": nl, "--nd": nd,
    "--blur": `${t.glassBlur}px`, "--op": `${t.glassOpacity}%`, "--bd": `${t.glassBorder}%`, "--radius": `${t.radius}px`,
    "--av": `${t.avatarSize}px`, "--avr": AVR[t.avatarShape], "--aj": J[t.avatarPos], "--al": t.align, "--jc": JC[t.align],
    "--ts": `${t.titleSize}px`, "--bs": `${t.bioSize}px`, "--up": t.upper ? "uppercase" : "none", "--soc": `${t.socialSize}px`,
    "--dim": t.bgType === "image" ? t.bgDim / 100 : 0,
  } as React.CSSProperties;

  const nav = (bottom = false) =>
    icons.length ? (
      <nav className={`socials${bottom ? " bot" : ""}`}>
        {icons.map((s) => (
          <a key={s.key} href={s.url} aria-label={s.title} {...(/^https?:/i.test(s.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`chip${t.socialStyle === "chip" ? " surf" : ""}${s.color ? " col" : ""}${s.image ? " img" : ""}`}
            style={{ "--r": SHP[s.shape || t.iconShape] } as React.CSSProperties}>
            <Ico r={s} ink={ink} className="ci" />
          </a>
        ))}
      </nav>
    ) : null;

  const L = t.header;
  const bn = t.banner || (L === "hero" ? t.avatar : "");

  return (
    <div className={`pg${embedded ? " emb" : ""}${t.avatarGlow ? " glow" : ""}`} data-style={t.style}
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
              {t.name && <h2 className="nm">{t.name}</h2>}
              <h1>{t.title}</h1>
              {t.bio && <p className="bio">{t.bio}</p>}
            </div>
          </div>
          {t.socialPos !== "bottom" && nav()}
        </header>

        <section className="grid">
          {cards.map((c, i) => (
            <div key={c.key} className={`card surf ${eff[i]}`} style={{ "--i": i } as React.CSSProperties}>
              <a className="cl" href={c.url} aria-label={c.title}
                {...(/^https?:/i.test(c.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {hasIcon(c) && (
                  <span className={`icw${c.color ? " col" : ""}${c.image ? " img" : ""}`} style={{ "--r": SHP[c.shape || t.iconShape] } as React.CSSProperties}>
                    <Ico r={c} ink={ink} />
                  </span>
                )}
                <span className="tt">{c.title}</span>
              </a>
              <CardMenu url={c.url} title={c.title} />
            </div>
          ))}
        </section>
        {t.socialPos !== "top" && nav(true)}
      </main>
    </div>
  );
}
