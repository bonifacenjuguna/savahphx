// Notifications: types, cleaning, templates and small helpers shared by the public page and the admin.
// Nothing here touches the database, so it is safe to import anywhere.

export const KINDS = [
  { id: "info", name: "Info", color: "#38bdf8" },
  { id: "update", name: "Update", color: "#8b5cf6" },
  { id: "offer", name: "Offer", color: "#f59e0b" },
  { id: "event", name: "Event", color: "#10b981" },
  { id: "news", name: "News", color: "#ec4899" },
  { id: "alert", name: "Alert", color: "#ef4444" },
] as const;
export type KindId = (typeof KINDS)[number]["id"];
export const kindOf = (id: string) => KINDS.find((k) => k.id === id) ?? KINDS[0];
export const tintOf = (n: { kind: string; color: string }) => n.color || kindOf(n.kind).color;

// 24x24 stroke glyphs (inner SVG markup) for each kind and callout tone.
export const KIND_GLYPH: Record<string, string> = {
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/>',
  update: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/>',
  offer: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  event: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  news: '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z"/><path d="M19 9h2v8a2 2 0 0 1-2 2M8 9h7M8 13h7M8 16h4"/>',
  alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  success: '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.6 2.6L16 9.6"/>',
  warning: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  danger: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
};

export type Tone = "info" | "success" | "warning" | "danger";
export const TONES: readonly Tone[] = ["info", "success", "warning", "danger"];

export type Block =
  | { id: string; t: "h"; text: string }
  | { id: string; t: "p"; text: string }
  | { id: string; t: "img"; url: string; caption: string }
  | { id: string; t: "gallery"; urls: string[] }
  | { id: string; t: "ul" | "ol"; items: string[] }
  | { id: string; t: "quote"; text: string; by: string }
  | { id: string; t: "callout"; tone: Tone; text: string }
  | { id: string; t: "btn"; label: string; url: string; look: "solid" | "outline" }
  | { id: string; t: "code"; text: string; label: string }
  | { id: string; t: "kv"; rows: { k: string; v: string }[] }
  | { id: string; t: "hr" };

export type Notif = {
  key: string;
  title: string;
  summary: string;
  kind: KindId;
  color: string; // optional accent override, "" = use the kind color
  image: string; // cover image
  blocks: Block[];
  cta: string; // main button label
  ctaUrl: string;
  pinned: boolean;
  quiet: boolean; // listed, but never rings the bell or adds to the count
  status: "published" | "draft";
  publishAt: number | null; // epoch ms; in the future = scheduled
  expiresAt: number | null; // epoch ms; passed = hidden from visitors
  createdAt: number;
  updatedAt: number;
  rev: number; // "Notify again" raises this so everyone sees it as unread once more
};

export const LIMITS = { title: 80, summary: 160, text: 2000, caption: 140, label: 40, items: 20, item: 200, rows: 12, gallery: 6, blocks: 40, code: 400 };

const rid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 10);
const s = (v: unknown, m: number) => (typeof v === "string" ? v.slice(0, m) : "");
const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : "");
const https = (v: unknown) => (typeof v === "string" && /^https:\/\//i.test(v.trim()) ? v.trim().slice(0, 500) : "");

// Only web, mail, phone and same-site links are ever allowed (no javascript: and friends).
export function safeHref(v: unknown): string {
  const u = typeof v === "string" ? v.trim().slice(0, 500) : "";
  if (/^(https?:\/\/|mailto:|tel:)\S+$/i.test(u)) return u;
  if (/^\/(?!\/)\S*$/.test(u)) return u;
  return "";
}

export const emptyNotif = (): Notif => ({
  key: rid(), title: "", summary: "", kind: "info", color: "", image: "", blocks: [], cta: "", ctaUrl: "",
  pinned: false, quiet: false, status: "published", publishAt: null, expiresAt: null, createdAt: Date.now(), updatedAt: Date.now(), rev: 1,
});

export function cleanBlock(x: unknown): Block | null {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const id = s(o.id, 24).replace(/[^\w-]/g, "") || rid();
  const list = (v: unknown, n: number, m: number) => (Array.isArray(v) ? v.map((i) => s(i, m).trim()).filter(Boolean).slice(0, n) : []);
  switch (o.t) {
    case "h": { const text = s(o.text, 120).trim(); return text ? { id, t: "h", text } : null; }
    case "p": { const text = s(o.text, LIMITS.text).trim(); return text ? { id, t: "p", text } : null; }
    case "img": { const url = https(o.url); return url ? { id, t: "img", url, caption: s(o.caption, LIMITS.caption).trim() } : null; }
    case "gallery": { const urls = (Array.isArray(o.urls) ? o.urls : []).map(https).filter(Boolean).slice(0, LIMITS.gallery); return urls.length ? { id, t: "gallery", urls } : null; }
    case "ul": case "ol": { const items = list(o.items, LIMITS.items, LIMITS.item); return items.length ? { id, t: o.t, items } : null; }
    case "quote": { const text = s(o.text, 600).trim(); return text ? { id, t: "quote", text, by: s(o.by, 60).trim() } : null; }
    case "callout": { const text = s(o.text, 600).trim(); return text ? { id, t: "callout", tone: TONES.includes(o.tone as Tone) ? (o.tone as Tone) : "info", text } : null; }
    case "btn": { const label = s(o.label, LIMITS.label).trim(); const url = safeHref(o.url); return label && url ? { id, t: "btn", label, url, look: o.look === "outline" ? "outline" : "solid" } : null; }
    case "code": { const text = s(o.text, LIMITS.code).trim(); return text ? { id, t: "code", text, label: s(o.label, LIMITS.label).trim() } : null; }
    case "kv": {
      const rows = (Array.isArray(o.rows) ? o.rows : []).map((r) => { const q = (r && typeof r === "object" ? r : {}) as Record<string, unknown>; return { k: s(q.k, 40).trim(), v: s(q.v, 120).trim() }; }).filter((r) => r.k && r.v).slice(0, LIMITS.rows);
      return rows.length ? { id, t: "kv", rows } : null;
    }
    case "hr": return { id, t: "hr" };
    default: return null;
  }
}
export const cleanBlocks = (v: unknown): Block[] => (Array.isArray(v) ? v.map(cleanBlock).filter((b): b is Block => !!b).slice(0, LIMITS.blocks) : []);

const ts = (v: unknown): number | null => { const n = Number(v); return v != null && v !== "" && Number.isFinite(n) && n > 0 ? Math.round(n) : null; };

export function cleanNotif(x: unknown): Notif {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const kind = KINDS.some((k) => k.id === o.kind) ? (o.kind as KindId) : "info";
  const cta = s(o.cta, LIMITS.label).trim();
  const ctaUrl = safeHref(o.ctaUrl);
  return {
    key: s(o.key, 64).replace(/[^\w-]/g, "") || rid(),
    title: s(o.title, LIMITS.title).trim(), summary: s(o.summary, LIMITS.summary).trim(), kind, color: hex(o.color), image: https(o.image),
    blocks: cleanBlocks(o.blocks), cta: cta && ctaUrl ? cta : "", ctaUrl: cta && ctaUrl ? ctaUrl : "",
    pinned: !!o.pinned, quiet: !!o.quiet, status: o.status === "draft" ? "draft" : "published",
    publishAt: ts(o.publishAt), expiresAt: ts(o.expiresAt),
    createdAt: ts(o.createdAt) ?? Date.now(), updatedAt: ts(o.updatedAt) ?? Date.now(), rev: Math.max(1, Math.min(9999, Math.round(Number(o.rev)) || 1)),
  };
}

export type NState = "live" | "scheduled" | "draft" | "expired";
export const stateOf = (n: Notif, now = Date.now()): NState =>
  n.status === "draft" ? "draft" : n.expiresAt != null && n.expiresAt <= now ? "expired" : n.publishAt != null && n.publishAt > now ? "scheduled" : "live";
export const liveAt = (n: Notif, now = Date.now()) => stateOf(n, now) === "live";
export const stamp = (n: Notif) => n.publishAt ?? n.createdAt;
export const sortN = (a: Notif, b: Notif) => Number(b.pinned) - Number(a.pinned) || stamp(b) - stamp(a);
// Read and delete marks are kept per device against this key, so "Notify again" brings an item back as unread.
export const readKey = (n: Pick<Notif, "key" | "rev">) => `${n.key}.${n.rev}`;

export function ago(ms: number, now = Date.now()) {
  const sec = Math.max(1, Math.round((now - ms) / 1000));
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)} h ago`;
  const d = Math.round(sec / 86400);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric", year: new Date(ms).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric" });
}

export function bucket(n: Notif, now = Date.now()): string {
  if (n.pinned) return "Pinned";
  const day = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diff = Math.round((day(now) - day(stamp(n))) / 864e5);
  return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This week" : "Earlier";
}

// Quick starts for the composer.
const B = {
  h: (text: string): Block => ({ id: rid(), t: "h", text }),
  p: (text: string): Block => ({ id: rid(), t: "p", text }),
  ul: (items: string[]): Block => ({ id: rid(), t: "ul", items }),
  img: (): Block => ({ id: rid(), t: "img", url: "", caption: "" }),
  callout: (tone: Tone, text: string): Block => ({ id: rid(), t: "callout", tone, text }),
  btn: (label: string, url = ""): Block => ({ id: rid(), t: "btn", label, url, look: "solid" }),
  code: (text: string, label: string): Block => ({ id: rid(), t: "code", text, label }),
  kv: (rows: [string, string][]): Block => ({ id: rid(), t: "kv", rows: rows.map(([k, v]) => ({ k, v })) }),
};
export const TEMPLATES: { id: string; name: string; note: string; make: () => Partial<Notif> }[] = [
  { id: "news", name: "Announcement", note: "Big news with highlights", make: () => ({ kind: "news", title: "Big news", summary: "Something new is here.", blocks: [B.img(), B.p("Here is what is **new** and why it matters to you."), B.ul(["First highlight", "Second highlight", "Third highlight"]), B.btn("Take a look")] }) },
  { id: "drop", name: "New release", note: "Product or content drop", make: () => ({ kind: "update", title: "Just dropped", summary: "Fresh from the studio.", blocks: [B.img(), B.h("What you get"), B.p("A short, punchy description. Mention the best part first."), B.btn("Get it now")] }) },
  { id: "event", name: "Event invite", note: "Date, place and a button", make: () => ({ kind: "event", title: "You are invited", summary: "Save the date.", blocks: [B.p("Join me for a special evening. Spots are limited."), B.kv([["Date", "Saturday, 20 June"], ["Time", "7:00 PM"], ["Where", "Venue name, City"]]), B.callout("info", "Doors open 30 minutes early."), B.btn("Reserve a spot")] }) },
  { id: "promo", name: "Discount code", note: "Copyable promo code", make: () => ({ kind: "offer", title: "A little thank you", summary: "Use this code at checkout.", pinned: true, blocks: [B.p("Enjoy **20% off** your next order."), B.code("THANKS20", "Promo code"), B.callout("warning", "Ends this Sunday."), B.btn("Shop now")] }) },
  { id: "alert", name: "Heads up", note: "Downtime or important notice", make: () => ({ kind: "alert", title: "Quick heads up", summary: "Something you should know.", blocks: [B.callout("warning", "Replies may be slower than usual this week."), B.p("Thank you for your patience. I will be back to normal on Monday.")] }) },
  { id: "log", name: "What is new", note: "Changelog style update", make: () => ({ kind: "update", title: "What is new", summary: "A few improvements.", blocks: [B.h("Added"), B.ul(["New thing one", "New thing two"]), B.h("Improved"), B.ul(["Faster loading", "Cleaner look"])] }) },
];
