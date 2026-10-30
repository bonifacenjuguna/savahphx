export const LAYOUTS = ["classic", "banner", "hero", "card", "side"] as const;
export const FONTS = ["sora", "inter", "space", "dm", "playfair"] as const;
export const BG_TYPES = ["mesh", "gradient", "solid", "image"] as const;
const AL = ["left", "center", "right"] as const;

export type Settings = {
  title: string; bio: string; avatar: string; banner: string;
  header: (typeof LAYOUTS)[number]; align: (typeof AL)[number];
  avatarShape: "circle" | "rounded" | "square"; avatarSize: number; avatarPos: (typeof AL)[number]; avatarGlow: boolean;
  titleSize: number; bioSize: number; upper: boolean; font: (typeof FONTS)[number];
  socialPos: "top" | "bottom" | "both"; socialStyle: "plain" | "glass" | "brand"; socialSize: number;
  bgType: (typeof BG_TYPES)[number]; bg: string; bg2: string; bgImage: string; bgDim: number; bgBlur: number;
  accent: string; text: string; glassTint: string; glassBlur: number; glassOpacity: number; glassBorder: number; radius: number;
  entrance: boolean; hover: boolean;
};

export const defaultSettings: Settings = {
  title: "HIGHEST IN THE ROOM", bio: "UID: 52388355297", avatar: "", banner: "",
  header: "classic", align: "center",
  avatarShape: "circle", avatarSize: 112, avatarPos: "center", avatarGlow: true,
  titleSize: 26, bioSize: 15, upper: true, font: "sora",
  socialPos: "top", socialStyle: "glass", socialSize: 46,
  bgType: "mesh", bg: "#070910", bg2: "#1b1245", bgImage: "", bgDim: 45, bgBlur: 0,
  accent: "#8ab4ff", text: "#f5f7ff", glassTint: "#ffffff", glassBlur: 22, glassOpacity: 8, glassBorder: 16, radius: 22,
  entrance: true, hover: true,
};

export const PRESETS: { name: string; v: Partial<Settings> }[] = [
  { name: "Midnight Glass", v: { bgType: "mesh", bg: "#070910", bg2: "#1b1245", accent: "#8ab4ff", text: "#f5f7ff", glassTint: "#ffffff", glassOpacity: 8, glassBorder: 16, glassBlur: 22 } },
  { name: "Aurora", v: { bgType: "mesh", bg: "#04120f", bg2: "#0b2a4a", accent: "#34d399", text: "#ecfff8", glassTint: "#ffffff", glassOpacity: 9, glassBorder: 18, glassBlur: 24 } },
  { name: "Sunset", v: { bgType: "mesh", bg: "#150910", bg2: "#44123a", accent: "#fb923c", text: "#fff3ea", glassTint: "#ffffff", glassOpacity: 10, glassBorder: 18, glassBlur: 22 } },
  { name: "Frost Light", v: { bgType: "gradient", bg: "#eef2ff", bg2: "#cfe3ff", accent: "#4f46e5", text: "#0f172a", glassTint: "#ffffff", glassOpacity: 55, glassBorder: 12, glassBlur: 18 } },
  { name: "Mono", v: { bgType: "gradient", bg: "#0a0a0a", bg2: "#1c1c1c", accent: "#ffffff", text: "#fafafa", glassTint: "#ffffff", glassOpacity: 6, glassBorder: 14, glassBlur: 16 } },
];

// Brand logos by URL (Simple Icons CDN). No hex = official brand color.
export const logoUrl = (slug: string, hex?: string) =>
  `https://cdn.simpleicons.org/${slug}${hex ? `/${hex}` : ""}`;

export type Row = {
  key: string; // stable id (saved as `uid`)
  kind: "card" | "social";
  title: string; url: string; icon: string; image: string;
  width: "full" | "half"; visible: boolean;
  shortcutOf: string; // social icon mirrors the card with this key
};

const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
const num = (v: unknown, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : d);
const img = (v: unknown) => (typeof v === "string" && /^https:\/\//i.test(v) ? v : "");
const str = (v: unknown, d: string, max: number) => (typeof v === "string" ? v.slice(0, max) : d);

// Validates and fills defaults; also migrates the old name/uid/blur keys.
export function normalize(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = defaultSettings;
  return {
    title: str(r.title ?? r.name, d.title, 80), bio: str(r.bio ?? r.uid, d.bio, 300),
    avatar: img(r.avatar), banner: img(r.banner),
    header: pick(r.header, LAYOUTS, d.header), align: pick(r.align, AL, d.align),
    avatarShape: pick(r.avatarShape, ["circle", "rounded", "square"], d.avatarShape),
    avatarSize: num(r.avatarSize, 64, 200, d.avatarSize), avatarPos: pick(r.avatarPos, AL, d.avatarPos),
    avatarGlow: r.avatarGlow === undefined ? d.avatarGlow : !!r.avatarGlow,
    titleSize: num(r.titleSize, 14, 56, d.titleSize), bioSize: num(r.bioSize, 11, 24, d.bioSize),
    upper: r.upper === undefined ? d.upper : !!r.upper, font: pick(r.font, FONTS, d.font),
    socialPos: pick(r.socialPos, ["top", "bottom", "both"], d.socialPos),
    socialStyle: pick(r.socialStyle, ["plain", "glass", "brand"], d.socialStyle),
    socialSize: num(r.socialSize, 32, 72, d.socialSize),
    bgType: pick(r.bgType, BG_TYPES, d.bgType), bg: hex(r.bg, d.bg), bg2: hex(r.bg2, d.bg2),
    bgImage: img(r.bgImage), bgDim: num(r.bgDim, 0, 90, d.bgDim), bgBlur: num(r.bgBlur, 0, 30, d.bgBlur),
    accent: hex(r.accent, d.accent), text: hex(r.text, d.text), glassTint: hex(r.glassTint, d.glassTint),
    glassBlur: num(r.glassBlur ?? r.blur, 0, 40, d.glassBlur), glassOpacity: num(r.glassOpacity, 0, 80, d.glassOpacity),
    glassBorder: num(r.glassBorder, 0, 60, d.glassBorder), radius: num(r.radius, 0, 40, d.radius),
    entrance: r.entrance === undefined ? d.entrance : !!r.entrance, hover: r.hover === undefined ? d.hover : !!r.hover,
  };
}
