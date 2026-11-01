import { byId, svgUri } from "@/lib/platforms";
import { effSizes, emptyRow, logoUrl, type Row, type Settings } from "@/lib/theme";
import CardMenu from "./CardMenu";
import { NoteCard, WalletCard } from "./Cards";
import { LogoImg, LogoMask } from "./Logo";
import ZoomImg from "./Zoom";

const J = { left: "start", center: "center", right: "end" } as const;
const JC = { left: "flex-start", center: "center", right: "flex-end" } as const;
const AVR = { circle: "50%", rounded: "28%", square: "10px" } as const;
const SHP = { circle: "50%", rounded: "30%", square: "8px" } as const;
const DEN = { tight: { gap: 8, hg: 8, pt: 18, ha: 10, cp: 10 }, cozy: { gap: 10, hg: 10, pt: 26, ha: 14, cp: 12 }, roomy: { gap: 14, hg: 14, pt: 42, ha: 22, cp: 16 } } as const;
const ext = (u: string) => (/^https?:/i.test(u) ? { target: "_blank", rel: "noopener noreferrer" } : {});

const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const lum = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export const hasIcon = (r: Row) => { const p = byId(r.platform); return !!(r.image || r.icon || p?.slug || p?.svg); };
const inkCard = (t: Settings) => (t.cardColor || t.text).slice(1);
const inkIcon = (t: Settings) => (t.iconColor || t.text).slice(1);

export function cssVars(t: Settings) {
  const light = lum(t.bg) > 0.55;
  const d = DEN[t.density];
  return {
    "--bg": t.bg, "--bg2": t.bg2, "--accent": t.accent, "--accent2": t.accent2, "--text": t.text, "--tint": t.glassTint,
    "--c-name": t.nameColor || t.text, "--c-title": t.titleColor || t.text, "--c-bio": t.bioColor || t.text,
    "--c-card": t.cardColor || t.text, "--c-foot": t.footerColor || t.text,
    "--nl": light ? "#ffffff" : mixHex(t.bg, "#ffffff", 0.09), "--nd": light ? mixHex(t.bg, "#000000", 0.18) : mixHex(t.bg, "#000000", 0.55),
    "--blur": `${t.glassBlur}px`, "--op": `${t.glassOpacity}%`, "--bd": `${t.glassBorder}%`, "--radius": `${t.radius}px`,
    "--av": `${t.avatarSize}px`, "--avr": AVR[t.avatarShape], "--aj": J[t.avatarPos], "--al": t.align, "--jc": JC[t.align],
    "--ns": `${t.nameSize}px`, "--ts": `${t.titleSize}px`, "--bs": `${t.bioSize}px`, "--up": t.upper ? "uppercase" : "none", "--soc": `${t.socialSize}px`,
    "--dim": t.bgType === "image" ? t.bgDim / 100 : 0, "--speed": t.speed, "--stg": `${t.stagger}ms`,
    "--bnh": `${t.bannerH}px`, "--bfit": t.bannerFit === "stretch" ? "fill" : "cover", "--gap": `${d.gap}px`, "--hg": `${d.hg}px`, "--pt": `${d.pt}px`, "--ha": `${d.ha}px`, "--cp": `${d.cp}px`,
  } as React.CSSProperties;
}

// Verification checkmark (a rounded seal with a tick), sized to the text it sits beside.
export function Verified({ color }: { color: string }) {
  return (
    <svg className="vf" viewBox="0 0 24 24" role="img" aria-label="Verified">
      <path fill={color} d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m8.6 12.2 2.4 2.4 4.5-4.7" />
    </svg>
  );
}

// One logo, normal (given color) or colored (brand).
export function Ico({ r, ink, className }: { r: Row; ink: string; className?: string }) {
  const p = byId(r.platform);
  const slug = r.icon || p?.slug || "";
  const col = r.color ? p?.color ?? "#ffffff" : "#" + ink;
  if (r.image) return <LogoImg className={className} src={r.image} />;
  if (!r.icon && p?.svg) return <LogoImg className={className} src={svgUri(p.svg, col)} />;
  if (!slug) return null;
  if (!r.icon && p?.legacy) return <LogoMask className={className} url={`https://cdn.jsdelivr.net/npm/simple-icons@12/icons/${slug}.svg`} color={col} />;
  return <LogoImg className={className} src={logoUrl(slug, r.color ? undefined : ink)} />;
}

export function CardIcon({ r, t }: { r: Row; t: Settings }) {
  if (!hasIcon(r)) return null;
  return (
    <span className={`icw${r.color ? " col" : ""}${r.image ? " img" : ""}`} style={{ "--r": SHP[r.shape || t.iconShape] } as React.CSSProperties}>
      <Ico r={r} ink={inkCard(t)} />
    </span>
  );
}

export function Chip({ s, t, inert }: { s: Row; t: Settings; inert?: boolean }) {
  const cls = `chip${t.socialStyle === "chip" ? " surf" : ""}${s.color ? " col" : ""}${s.image ? " img" : ""}`;
  const style = { "--r": SHP[s.shape || t.iconShape] } as React.CSSProperties;
  const body = <Ico r={s} ink={inkIcon(t)} className="ci" />;
  return inert ? <span className={cls} style={style}>{body}</span>
    : <a className={cls} style={style} href={s.url} aria-label={s.title} data-tk={s.key} data-ta="icon" data-tt={s.title} {...ext(s.url)}>{body}</a>;
}

export function Powered({ t, inline }: { t: Settings; inline?: boolean }) {
  const cls = `pw surf pw-${inline ? "inline" : t.poweredPos} s-${t.poweredSide} a-${t.poweredAlign}`;
  const ink = (t.footerColor || t.text).slice(1);
  const logo = t.poweredLogo ? <img className="pwl" src={t.poweredLogo} alt="" />
    : t.poweredPlatform && byId(t.poweredPlatform) ? <span className="pwl"><Ico r={{ ...emptyRow(), platform: t.poweredPlatform, color: t.poweredColor }} ink={ink} /></span>
    : <svg className="pwl sp" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>;
  const inner = <>{logo}<span>{t.poweredText} {t.poweredName && <b>{t.poweredName}</b>}</span></>;
  return t.poweredUrl && !inline ? <a className={cls} href={t.poweredUrl} {...ext(t.poweredUrl)}>{inner}</a> : <div className={cls}>{inner}</div>;
}

// Small themed box the admin uses to preview things in place.
export function Mini({ t, children, motion, className = "" }: { t: Settings; children: React.ReactNode; motion?: boolean; className?: string }) {
  return (
    <div className={`mini${t.avatarGlow ? " glow" : ""}${className ? " " + className : ""}`} data-style={t.style} data-font={t.font}
      data-en={motion && t.entrance ? t.entranceStyle : "none"} data-hv={motion && t.hover ? t.hoverStyle : "none"} data-am={motion ? t.avatarMotion : "none"}
      style={{ ...cssVars(t), background: t.bg }}>{children}</div>
  );
}

// Shared by the public page and the admin live preview.
export default function Page({ rows, t, embedded }: { rows: Row[]; t: Settings; embedded?: boolean }) {
  const cards = rows.filter((r) => r.visible);
  const eff = effSizes(cards);
  const icons = rows.filter((r) => r.type === "link" && r.asIcon && r.url);
  const type = t.style === "neu" && t.bgType !== "image" ? "solid" : t.bgType;
  const bgImg =
    type === "gradient" ? `linear-gradient(160deg,${t.bg},${t.bg2})`
    : type === "mesh" ? `radial-gradient(55% 45% at 12% 8%,${t.accent}66,transparent 70%),radial-gradient(50% 50% at 90% 15%,${t.accent2}55,transparent 70%),radial-gradient(60% 55% at 20% 95%,${t.bg2},transparent 70%),radial-gradient(45% 40% at 85% 90%,${t.accent}33,transparent 70%)`
    : undefined;

  const nav = (bottom = false) =>
    icons.length ? <nav className={`socials${bottom ? " bot" : ""}`}>{icons.map((s) => <Chip key={s.key} s={s} t={t} />)}</nav> : null;

  // A banner you uploaded is never ignored: Classic switches to the Banner look when one is set.
  const L = t.header === "classic" && t.banner && t.showBanner ? "banner" : t.header;
  const showAv = t.showAvatar && L !== "hero";
  const showBn = t.showBanner && L !== "classic";
  const bn = t.banner || (L === "hero" ? t.avatar : "");
  const hasText = (t.showName && !!t.name) || (t.showTitle && !!t.title) || (t.showBio && !!t.bio);
  const showHd = t.showHeader && (showBn || showAv || hasText);
  // Photo on a side: photo and text sit next to each other and the text follows the photo's side.
  const rowMode = showAv && L !== "hero" && (t.avatarPos !== "center" || L === "side");
  const nameOn = t.showName && !!t.name;
  const badge = t.verified ? <Verified color={t.verifiedColor} /> : null;
  const topNav = t.socialPos === "top" || t.socialPos === "both" ? nav() : null;
  const botNav = t.socialPos === "bottom" || t.socialPos === "both" ? nav(true) : null;
  const pw = t.poweredShow && !!(t.poweredName || t.poweredText || t.poweredLogo || t.poweredPlatform);

  return (
    <div className={`pg${embedded ? " emb" : ""}${t.avatarGlow ? " glow" : ""}${pw && t.poweredPos !== "end" ? ` pwc pwc-${t.poweredSide}` : ""}`} data-style={t.style}
      data-font={t.font} data-en={t.entrance ? t.entranceStyle : "none"} data-hv={t.hover ? t.hoverStyle : "none"} data-am={t.avatarMotion} data-apos={t.avatarPos} style={cssVars(t)}>
      <div className="bgfx" data-m={t.bgMotion} style={{ backgroundColor: t.bg, backgroundImage: bgImg }}>
        {t.bgType === "image" && t.bgImage && <img className="bgi" src={t.bgImage} alt="" style={{ filter: `blur(${t.bgBlur}px)` }} />}
      </div>
      <main className={`wrap${showHd ? "" : " pt"}`}>
        {showHd ? (
          <header className={`hd hd-${L}${showAv ? "" : " noav"}${rowMode ? " row" : ""}${rowMode && showBn ? " ovl" : ""}`}>
            {showBn && <div className={`bn${t.bannerFade ? "" : " nf"}`}>{bn && <ZoomImg src={bn} />}</div>}
            <div className="sr">
              {showAv && (t.avatar ? <ZoomImg className="av" src={t.avatar} /> : <div className="av" />)}
              {hasText && (
                <div className="tx">
                  {nameOn && <h2 className="nm"><span>{t.name}</span>{badge}</h2>}
                  {t.showTitle && t.title && (nameOn || !badge ? <h1>{t.title}</h1> : <h1 className="vb"><span>{t.title}</span>{badge}</h1>)}
                  {t.showBio && t.bio && <p className="bio">{t.bio}</p>}
                </div>
              )}
            </div>
            {topNav}
          </header>
        ) : topNav && <div className="pad">{topNav}</div>}

        <section className="grid">
          {cards.map((c, i) =>
            c.type === "text" ? <NoteCard key={c.key} r={c} cls={eff[i]} i={i} />
            : c.type === "wallet" ? <WalletCard key={c.key} r={c} cls={eff[i]} i={i} />
            : (
              <div key={c.key} className={`card surf ${eff[i]}`} style={{ "--i": i } as React.CSSProperties}>
                <a className="cl" href={c.url} aria-label={c.title} data-tk={c.key} data-tt={c.title} {...ext(c.url)}>
                  <CardIcon r={c} t={t} />
                  <span className="tt">{c.title}</span>
                </a>
                <CardMenu id={c.key} url={c.url} title={c.title} />
              </div>
            ))}
        </section>
        {botNav}
        {pw && t.poweredPos === "end" && <Powered t={t} />}
      </main>
      {pw && t.poweredPos !== "end" && <Powered t={t} />}
    </div>
  );
}
