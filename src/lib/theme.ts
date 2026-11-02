export const LAYOUTS = ["classic", "banner", "hero", "card", "side"] as const;
export const FONTS = ["sora", "inter", "space", "dm", "playfair"] as const;
export const BG_TYPES = ["mesh", "gradient", "solid", "image"] as const;
export const STYLE_IDS = ["glass", "neu", "flat", "dark", "mesh"] as const;
export const ENTRANCES = ["rise", "fade", "zoom", "slide", "flip", "blur"] as const;
export const HOVERS = ["lift", "glow", "scale", "tilt", "shine"] as const;
export const AVATAR_MOTIONS = ["none", "float", "pulse", "ring"] as const;
export const BG_MOTIONS = ["none", "drift", "aurora"] as const;
export const DENSITIES = ["tight", "cozy", "roomy"] as const;
const AL = ["left", "center", "right"] as const;
const SH = ["circle", "rounded", "square"] as const;

export type Settings = {
  name: string; title: string; bio: string; avatar: string; banner: string; bannerFit: "cover" | "stretch"; bannerH: number; bannerFade: boolean;
  header: (typeof LAYOUTS)[number]; align: (typeof AL)[number];
  avatarShape: (typeof SH)[number]; avatarSize: number; avatarPos: (typeof AL)[number]; avatarGlow: boolean; glowAmt: number;
  bellOn: boolean; bellAlways: boolean; bellPos: (typeof BELL_POS)[number]; bellStyle: (typeof BELL_STYLES)[number]; bellSize: number;
  bellColor: string; bellBg: string; bellBadge: "number" | "dot"; bellBadgeColor: string; bellSwing: boolean; bellEvery: number; bellTitle: string; bellEmpty: string;
  hdv: number; nameSize: number; titleSize: number; bioSize: number; verified: boolean; verifiedColor: string; upper: boolean; font: (typeof FONTS)[number]; density: (typeof DENSITIES)[number];
  socialPos: "top" | "bottom" | "both" | "off"; socialStyle: "plain" | "chip"; socialSize: number; iconShape: (typeof SH)[number];
  style: (typeof STYLE_IDS)[number];
  bgType: (typeof BG_TYPES)[number]; bg: string; bg2: string; bgImage: string; bgDim: number; bgBlur: number; bgBright: number; bgContrast: number; bgSat: number; bgHue: number; bgVignette: number;
  accent: string; accent2: string; text: string; glassTint: string; glassBlur: number; glassOpacity: number; glassBorder: number; radius: number;
  nameColor: string; titleColor: string; bioColor: string; cardColor: string; iconColor: string; footerColor: string;
  entrance: boolean; hover: boolean;
  entranceStyle: (typeof ENTRANCES)[number]; hoverStyle: (typeof HOVERS)[number];
  avatarMotion: (typeof AVATAR_MOTIONS)[number]; bgMotion: (typeof BG_MOTIONS)[number]; speed: number; stagger: number;
  showHeader: boolean; showAvatar: boolean; showBanner: boolean; showName: boolean; showTitle: boolean; showBio: boolean;
  poweredShow: boolean; poweredPos: "fixed" | "float" | "end"; poweredSide: "bottom" | "top" | "left" | "right"; poweredAlign: "start" | "center" | "end"; poweredText: string; poweredName: string; poweredUrl: string;
  poweredLogo: string; poweredPlatform: string; poweredColor: boolean;
};

export const defaultSettings: Settings = {
  name: "John Doe", title: "Creator and Developer", bio: "@johndoe", avatar: "", banner: "", bannerFit: "cover", bannerH: 200, bannerFade: true,
  header: "classic", align: "center",
  avatarShape: "circle", avatarSize: 112, avatarPos: "center", avatarGlow: true, glowAmt: 15,
  bellOn: true, bellAlways: false, bellPos: "top-right", bellStyle: "auto", bellSize: 44, bellColor: "", bellBg: "", bellBadge: "number", bellBadgeColor: "#ff3b30", bellSwing: true, bellEvery: 8, bellTitle: "Notifications", bellEmpty: "You're all caught up.",
  hdv: 3, nameSize: 22, titleSize: 16, bioSize: 14, verified: false, verifiedColor: "#1d9bf0", upper: false, font: "sora", density: "cozy",
  socialPos: "top", socialStyle: "chip", socialSize: 46, iconShape: "circle",
  style: "glass",
  bgType: "mesh", bg: "#070910", bg2: "#1b1245", bgImage: "", bgDim: 45, bgBlur: 0, bgBright: 100, bgContrast: 100, bgSat: 100, bgHue: 0, bgVignette: 0,
  accent: "#8ab4ff", accent2: "#c084fc", text: "#f5f7ff", glassTint: "#ffffff", glassBlur: 22, glassOpacity: 8, glassBorder: 16, radius: 22,
  nameColor: "", titleColor: "", bioColor: "", cardColor: "", iconColor: "", footerColor: "",
  entrance: true, hover: true, entranceStyle: "rise", hoverStyle: "lift", avatarMotion: "none", bgMotion: "none", speed: 1, stagger: 70,
  showHeader: true, showAvatar: true, showBanner: true, showName: true, showTitle: true, showBio: true,
  poweredShow: true, poweredPos: "fixed", poweredSide: "bottom", poweredAlign: "center", poweredText: "Powered by", poweredName: "John Doe", poweredUrl: "https://example.com",
  poweredLogo: "", poweredPlatform: "", poweredColor: false,
};

// Your own words and images. Layouts and "reset all design" never touch these.
export const CONTENT_KEYS: (keyof Settings)[] = ["name", "title", "bio", "avatar", "banner", "poweredText", "poweredName", "poweredUrl", "poweredLogo", "poweredPlatform", "bellTitle", "bellEmpty"];

export const STYLES: { id: Settings["style"]; name: string; v: Partial<Settings> }[] = [
  { id: "glass", name: "Glass", v: { bgType: "mesh", bg: "#070910", bg2: "#1b1245", accent: "#8ab4ff", accent2: "#c084fc", text: "#f5f7ff", radius: 22 } },
  { id: "neu", name: "Neumorphism", v: { bgType: "solid", bg: "#23272f", text: "#e9ecf3", accent: "#7aa2ff", radius: 24 } },
  { id: "flat", name: "Flat", v: { bgType: "solid", bg: "#101418", text: "#f2f5f8", accent: "#ff6b57", radius: 12 } },
  { id: "dark", name: "Dark aesthetic", v: { bgType: "gradient", bg: "#050505", bg2: "#12121a", text: "#ededed", accent: "#a78bfa", radius: 16 } },
  { id: "mesh", name: "Mesh gradient", v: { bgType: "mesh", bg: "#0b0420", bg2: "#3b0a5c", accent: "#ff5fa2", accent2: "#38bdf8", text: "#ffffff", radius: 26 } },
];

export const PRESETS: { name: string; v: Partial<Settings> }[] = [
  { name: "Midnight", v: { bg: "#070910", bg2: "#1b1245", accent: "#8ab4ff", accent2: "#c084fc", text: "#f5f7ff" } },
  { name: "Aurora", v: { bg: "#04120f", bg2: "#0b2a4a", accent: "#34d399", accent2: "#38bdf8", text: "#ecfff8" } },
  { name: "Sunset", v: { bg: "#150910", bg2: "#44123a", accent: "#fb923c", accent2: "#f472b6", text: "#fff3ea" } },
  { name: "Frost", v: { bg: "#eef2ff", bg2: "#cfe3ff", accent: "#4f46e5", accent2: "#06b6d4", text: "#0f172a", glassOpacity: 55, glassBorder: 12 } },
  { name: "Mono", v: { bg: "#0a0a0a", bg2: "#1c1c1c", accent: "#ffffff", accent2: "#9ca3af", text: "#fafafa" } },
];

export const logoUrl = (slug: string, hex?: string) => `https://cdn.simpleicons.org/${slug}${hex ? `/${hex}` : ""}`;

export type Row = {
  key: string; type: "link" | "text" | "wallet";
  platform: string; handle: string; title: string; url: string;
  icon: string; image: string; size: "full" | "half" | "third"; visible: boolean;
  asIcon: boolean; color: boolean; shape: "" | (typeof SH)[number];
  body: string; network: string; memo: string; qr: boolean;
  tall: 1 | 2 | 3; // card height in rows, separate from the width above
};
export const emptyRow = (): Row => ({ key: "", type: "link", platform: "", handle: "", title: "", url: "", icon: "", image: "", size: "full", visible: true, asIcon: false, color: false, shape: "", body: "", network: "btc", memo: "", qr: true, tall: 1 });

// Half cards pair up, thirds group in threes; leftovers widen so nothing sits alone awkwardly.
export function effSizes(cards: Row[]): Row["size"][] {
  const out: Row["size"][] = [];
  let i = 0;
  while (i < cards.length) {
    const sz = cards[i].size;
    let j = i;
    while (j < cards.length && cards[j].size === sz) j++;
    const n = sz === "half" ? 2 : sz === "third" ? 3 : 1;
    for (let k = i; k < j; k += n) {
      const len = Math.min(n, j - k);
      const e: Row["size"] = sz === "full" || len === 1 ? "full" : len === 2 ? "half" : "third";
      for (let m = 0; m < len; m++) out.push(e);
    }
    i = j;
  }
  return out;
}

export const BELL_POS = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;
export const BELL_STYLES = ["auto", "solid", "outline", "minimal"] as const;
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
const num = (v: unknown, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : d);
const img = (v: unknown) => (typeof v === "string" && /^https:\/\//i.test(v) ? v : "");
const str = (v: unknown, d: string, max: number) => (typeof v === "string" ? v.slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (v === undefined ? d : !!v);

export function normalize(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = defaultSettings;
  return {
    name: r.title === undefined ? d.name : str(r.name, d.name, 60),
    title: str(r.title ?? r.name, d.title, 80), bio: str(r.bio ?? r.uid, d.bio, 300),
    avatar: img(r.avatar), banner: img(r.banner),
    bannerFit: r.bannerFit === "stretch" ? "stretch" : "cover", bannerH: num(r.bannerH, 100, 380, d.bannerH), bannerFade: bool(r.bannerFade, d.bannerFade),
    header: pick(r.header, LAYOUTS, d.header), align: pick(r.align, AL, d.align),
    avatarShape: pick(r.avatarShape, SH, d.avatarShape), avatarSize: num(r.avatarSize, 64, 200, d.avatarSize),
    avatarPos: pick(r.avatarPos, AL, d.avatarPos), avatarGlow: bool(r.avatarGlow, d.avatarGlow), glowAmt: Number(r.hdv) >= 3 ? num(r.glowAmt, 0, 100, d.glowAmt) : d.glowAmt,
    bellOn: bool(r.bellOn, d.bellOn), bellAlways: bool(r.bellAlways, d.bellAlways), bellPos: pick(r.bellPos, BELL_POS, d.bellPos), bellStyle: pick(r.bellStyle, BELL_STYLES, d.bellStyle),
    bellSize: num(r.bellSize, 34, 64, d.bellSize), bellColor: r.bellColor === "" ? "" : hex(r.bellColor, ""), bellBg: r.bellBg === "" ? "" : hex(r.bellBg, ""),
    bellBadge: r.bellBadge === "dot" ? "dot" : "number", bellBadgeColor: hex(r.bellBadgeColor, d.bellBadgeColor), bellSwing: bool(r.bellSwing, d.bellSwing), bellEvery: num(r.bellEvery, 4, 30, d.bellEvery),
    bellTitle: str(r.bellTitle, d.bellTitle, 40), bellEmpty: str(r.bellEmpty, d.bellEmpty, 120),
    hdv: 3, nameSize: Number(r.hdv) >= 2 ? num(r.nameSize, 11, 40, d.nameSize) : d.nameSize, verified: bool(r.verified, d.verified), verifiedColor: hex(r.verifiedColor, d.verifiedColor),
    titleSize: Number(r.hdv) >= 2 ? num(r.titleSize, 14, 56, d.titleSize) : d.titleSize, bioSize: Number(r.hdv) >= 2 ? num(r.bioSize, 11, 24, d.bioSize) : d.bioSize,
    upper: bool(r.upper, d.upper), font: pick(r.font, FONTS, d.font), density: pick(r.density, DENSITIES, d.density),
    socialPos: pick(r.socialPos, ["top", "bottom", "both", "off"], d.socialPos),
    socialStyle: r.socialStyle === "plain" ? "plain" : "chip", socialSize: num(r.socialSize, 32, 72, d.socialSize),
    iconShape: pick(r.iconShape, SH, d.iconShape), style: pick(r.style, STYLE_IDS, d.style),
    bgType: pick(r.bgType, BG_TYPES, d.bgType), bg: hex(r.bg, d.bg), bg2: hex(r.bg2, d.bg2),
    bgImage: img(r.bgImage), bgDim: num(r.bgDim, 0, 90, d.bgDim), bgBlur: num(r.bgBlur, 0, 30, d.bgBlur),
    bgBright: num(r.bgBright, 40, 160, d.bgBright), bgContrast: num(r.bgContrast, 50, 160, d.bgContrast), bgSat: num(r.bgSat, 0, 220, d.bgSat),
    bgHue: num(r.bgHue, 0, 360, d.bgHue), bgVignette: num(r.bgVignette, 0, 90, d.bgVignette),
    accent: hex(r.accent, d.accent), accent2: hex(r.accent2, d.accent2), text: hex(r.text, d.text),
    glassTint: hex(r.glassTint, d.glassTint), glassBlur: num(r.glassBlur ?? r.blur, 0, 40, d.glassBlur),
    glassOpacity: num(r.glassOpacity, 0, 80, d.glassOpacity), glassBorder: num(r.glassBorder, 0, 60, d.glassBorder),
    radius: num(r.radius, 0, 40, d.radius),
    nameColor: hex(r.nameColor, ""), titleColor: hex(r.titleColor, ""), bioColor: hex(r.bioColor, ""),
    cardColor: hex(r.cardColor, ""), iconColor: hex(r.iconColor, ""), footerColor: hex(r.footerColor, ""),
    entrance: bool(r.entrance, d.entrance), hover: bool(r.hover, d.hover),
    entranceStyle: pick(r.entranceStyle, ENTRANCES, d.entranceStyle), hoverStyle: pick(r.hoverStyle, HOVERS, d.hoverStyle),
    avatarMotion: pick(r.avatarMotion, AVATAR_MOTIONS, d.avatarMotion), bgMotion: pick(r.bgMotion, BG_MOTIONS, d.bgMotion),
    speed: Math.round(num(r.speed, 0.5, 2, d.speed) * 10) / 10, stagger: Math.round(num(r.stagger, 20, 200, d.stagger)),
    showHeader: bool(r.showHeader, true), showAvatar: bool(r.showAvatar, true), showBanner: bool(r.showBanner, true),
    showName: bool(r.showName, true), showTitle: bool(r.showTitle, true), showBio: bool(r.showBio, true),
    poweredShow: bool(r.poweredShow, d.poweredShow), poweredPos: r.poweredPos === "float" ? "float" : r.poweredPos === "end" || r.poweredPos === "footer" ? "end" : "fixed",
    poweredSide: pick(r.poweredSide, ["bottom", "top", "left", "right"], "bottom"), poweredAlign: pick(r.poweredAlign, ["start", "center", "end"], "center"),
    poweredText: str(r.poweredText, d.poweredText, 40), poweredName: str(r.poweredName, d.poweredName, 40),
    poweredUrl: img(r.poweredUrl), poweredLogo: img(r.poweredLogo),
    poweredPlatform: str(r.poweredPlatform, "", 30).replace(/[^a-z0-9-]/g, ""), poweredColor: bool(r.poweredColor, false),
  };
}

export const RESET_GROUPS: { id: string; name: string; content?: boolean; keys: (keyof Settings)[] }[] = [
  { id: "profile", name: "Name, bio and photos", content: true, keys: ["name", "title", "bio", "avatar", "banner"] },
  { id: "text", name: "Text look and visibility", keys: ["font", "nameSize", "titleSize", "bioSize", "upper", "verified", "verifiedColor", "showName", "showTitle", "showBio", "showAvatar", "showBanner", "nameColor", "titleColor", "bioColor"] },
  { id: "header", name: "Header layout", keys: ["header", "align", "avatarShape", "avatarSize", "avatarPos", "avatarGlow", "glowAmt", "showHeader", "density", "bannerFit", "bannerH", "bannerFade"] },
  { id: "style", name: "Style and colors", keys: ["style", "accent", "accent2", "text", "glassTint", "glassBlur", "glassOpacity", "glassBorder", "radius", "cardColor", "iconColor"] },
  { id: "bg", name: "Background", keys: ["bgType", "bg", "bg2", "bgImage", "bgDim", "bgBlur", "bgBright", "bgContrast", "bgSat", "bgHue", "bgVignette"] },
  { id: "icons", name: "Icon row", keys: ["socialPos", "socialStyle", "socialSize", "iconShape"] },
  { id: "motion", name: "Motion", keys: ["entrance", "hover", "entranceStyle", "hoverStyle", "avatarMotion", "bgMotion", "speed", "stagger"] },
  { id: "footer", name: "Footer tag", content: true, keys: ["poweredShow", "poweredPos", "poweredSide", "poweredAlign", "poweredText", "poweredName", "poweredUrl", "poweredLogo", "poweredPlatform", "poweredColor", "footerColor"] },
  { id: "bell", name: "Notification bell", keys: ["bellOn", "bellAlways", "bellPos", "bellStyle", "bellSize", "bellColor", "bellBg", "bellBadge", "bellBadgeColor", "bellSwing", "bellEvery"] },
];

export type Layout = { id: string; name: string; at: number; s: Settings; rows?: Row[] };

// Every demo layout comes with the notification bell switched on and visible, styled to suit it.
const D = (o: Partial<Settings>): Settings => ({ ...defaultSettings, bellAlways: true, ...o });
export const DEMO_LAYOUTS: Layout[] = [
  { id: "demo-neon", name: "Neon Night", at: 0, s: D({ bellStyle: "solid", bellPos: "top-right", style: "mesh", header: "banner", bgType: "mesh", bg: "#0b0420", bg2: "#3b0a5c", accent: "#ff5fa2", accent2: "#38bdf8", text: "#ffffff", radius: 26, font: "space", iconShape: "rounded", entranceStyle: "zoom", hoverStyle: "glow", bgMotion: "drift", avatarMotion: "pulse" }) },
  { id: "demo-frost", name: "Clean Frost", at: 0, s: D({ bellStyle: "outline", style: "flat", header: "classic", bgType: "solid", bg: "#f4f6fb", text: "#111827", accent: "#2563eb", radius: 14, avatarShape: "rounded", font: "inter", avatarGlow: false, entranceStyle: "fade", hoverStyle: "scale" }) },
  { id: "demo-clay", name: "Soft Clay", at: 0, s: D({ style: "neu", header: "card", bgType: "solid", bg: "#e6e9ef", text: "#3b4252", accent: "#5b7cfa", radius: 28, font: "dm", avatarGlow: false, hoverStyle: "scale", density: "roomy" }) },
  { id: "demo-poster", name: "Poster Hero", at: 0, s: D({ bellStyle: "minimal", style: "dark", header: "hero", bgType: "gradient", bg: "#050505", bg2: "#14141c", accent: "#f5d90a", text: "#f4f4f5", radius: 14, font: "playfair", entranceStyle: "blur", hoverStyle: "shine", bgMotion: "aurora" }) },
  { id: "demo-photo", name: "Photo Theme", at: 0, s: D({ style: "glass", header: "banner", bgType: "image", bgDim: 28, bgBlur: 0, bgBright: 96, bgContrast: 108, bgSat: 112, bgVignette: 42, glassBlur: 30, glassOpacity: 20, glassBorder: 24, radius: 24, font: "sora", entranceStyle: "rise", hoverStyle: "lift", avatarGlow: true, glowAmt: 14, density: "cozy" }) },
  { id: "demo-side", name: "Side Profile", at: 0, s: D({ bellStyle: "outline", bellPos: "top-right", style: "glass", header: "side", align: "left", avatarPos: "left", avatarShape: "rounded", upper: false, socialPos: "bottom", entranceStyle: "slide", hoverStyle: "tilt", avatarMotion: "float" }) },
];

const NAMES: Partial<Record<keyof Settings, string>> = {
  title: "Bio", bio: "Extra lines", bg: "Background", bg2: "Second background", accent2: "Second accent", text: "Text color",
  entrance: "Entrance animation", hover: "Hover effect", socialPos: "Icon row placement", poweredUrl: "Footer link", poweredPos: "Footer style",
  poweredSide: "Footer edge", poweredAlign: "Footer alignment", poweredShow: "Footer tag", avatar: "Profile photo", banner: "Banner image",
  bgImage: "Background image", glassTint: "Surface tint", upper: "Uppercase bio", density: "Spacing", header: "Header layout", iconShape: "Icon shape",
  nameSize: "Name size", titleSize: "Bio size", bioSize: "Extra line size", verified: "Verified checkmark", verifiedColor: "Checkmark color", nameColor: "Name color", titleColor: "Bio color", bioColor: "Extra lines color", bellOn: "Notification bell", bellAlways: "Show bell with no posts", bellPos: "Bell position", bellStyle: "Bell style", bellSize: "Bell size", bellColor: "Bell icon color", bellBg: "Bell color", bellBadge: "Bell badge", bellBadgeColor: "Badge color", bellSwing: "Bell ring", bellEvery: "Ring every", bellTitle: "Notifications title", bellEmpty: "Notifications empty text", glowAmt: "Photo glow strength", bgBright: "Brightness", bgContrast: "Contrast", bgSat: "Saturation", bgHue: "Hue shift", bgVignette: "Vignette", bgDim: "Image dim", bgBlur: "Image blur", bannerFit: "Banner fit", bannerH: "Banner height", bannerFade: "Banner fade", speed: "Animation speed", stagger: "Delay between cards",
};
export const settingLabel = (k: keyof Settings) => NAMES[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
export const settingGroup = (k: keyof Settings) => RESET_GROUPS.find((g) => g.keys.includes(k))?.name ?? "Other";
