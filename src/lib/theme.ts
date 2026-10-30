export const LAYOUTS = ["classic", "banner", "hero", "card", "side"] as const;
export const FONTS = ["sora", "inter", "space", "dm", "playfair"] as const;
export const BG_TYPES = ["mesh", "gradient", "solid", "image"] as const;
export const STYLE_IDS = ["glass", "neu", "flat", "dark", "mesh"] as const;
const AL = ["left", "center", "right"] as const;
const SH = ["circle", "rounded", "square"] as const;

export type Settings = {
  name: string; title: string; bio: string; avatar: string; banner: string;
  header: (typeof LAYOUTS)[number]; align: (typeof AL)[number];
  avatarShape: (typeof SH)[number]; avatarSize: number; avatarPos: (typeof AL)[number]; avatarGlow: boolean;
  titleSize: number; bioSize: number; upper: boolean; font: (typeof FONTS)[number];
  socialPos: "top" | "bottom" | "both"; socialStyle: "plain" | "chip"; socialSize: number; iconShape: (typeof SH)[number];
  style: (typeof STYLE_IDS)[number];
  bgType: (typeof BG_TYPES)[number]; bg: string; bg2: string; bgImage: string; bgDim: number; bgBlur: number;
  accent: string; accent2: string; text: string; glassTint: string; glassBlur: number; glassOpacity: number; glassBorder: number; radius: number;
  entrance: boolean; hover: boolean;
};

export const defaultSettings: Settings = {
  name: "Savahphx", title: "HIGHEST IN THE ROOM", bio: "UID: 52388355297", avatar: "", banner: "",
  header: "classic", align: "center",
  avatarShape: "circle", avatarSize: 112, avatarPos: "center", avatarGlow: true,
  titleSize: 26, bioSize: 15, upper: true, font: "sora",
  socialPos: "top", socialStyle: "chip", socialSize: 46, iconShape: "circle",
  style: "glass",
  bgType: "mesh", bg: "#070910", bg2: "#1b1245", bgImage: "", bgDim: 45, bgBlur: 0,
  accent: "#8ab4ff", accent2: "#c084fc", text: "#f5f7ff", glassTint: "#ffffff", glassBlur: 22, glassOpacity: 8, glassBorder: 16, radius: 22,
  entrance: true, hover: true,
};

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
  key: string; platform: string; handle: string; title: string; url: string;
  icon: string; image: string; size: "full" | "half" | "third"; visible: boolean;
  asIcon: boolean; color: boolean; shape: "" | (typeof SH)[number];
};

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
    name: str(r.name === undefined || r.title === undefined ? d.name : r.name, d.name, 60),
    title: str(r.title ?? r.name, d.title, 80), bio: str(r.bio ?? r.uid, d.bio, 300),
    avatar: img(r.avatar), banner: img(r.banner),
    header: pick(r.header, LAYOUTS, d.header), align: pick(r.align, AL, d.align),
    avatarShape: pick(r.avatarShape, SH, d.avatarShape), avatarSize: num(r.avatarSize, 64, 200, d.avatarSize),
    avatarPos: pick(r.avatarPos, AL, d.avatarPos), avatarGlow: bool(r.avatarGlow, d.avatarGlow),
    titleSize: num(r.titleSize, 14, 56, d.titleSize), bioSize: num(r.bioSize, 11, 24, d.bioSize),
    upper: bool(r.upper, d.upper), font: pick(r.font, FONTS, d.font),
    socialPos: pick(r.socialPos, ["top", "bottom", "both"], d.socialPos),
    socialStyle: r.socialStyle === "plain" ? "plain" : "chip", socialSize: num(r.socialSize, 32, 72, d.socialSize),
    iconShape: pick(r.iconShape, SH, d.iconShape), style: pick(r.style, STYLE_IDS, d.style),
    bgType: pick(r.bgType, BG_TYPES, d.bgType), bg: hex(r.bg, d.bg), bg2: hex(r.bg2, d.bg2),
    bgImage: img(r.bgImage), bgDim: num(r.bgDim, 0, 90, d.bgDim), bgBlur: num(r.bgBlur, 0, 30, d.bgBlur),
    accent: hex(r.accent, d.accent), accent2: hex(r.accent2, d.accent2), text: hex(r.text, d.text),
    glassTint: hex(r.glassTint, d.glassTint), glassBlur: num(r.glassBlur ?? r.blur, 0, 40, d.glassBlur),
    glassOpacity: num(r.glassOpacity, 0, 80, d.glassOpacity), glassBorder: num(r.glassBorder, 0, 60, d.glassBorder),
    radius: num(r.radius, 0, 40, d.radius), entrance: bool(r.entrance, d.entrance), hover: bool(r.hover, d.hover),
  };
}
