// Notifications: the shared shape, cleaning and helpers (used by the page, the bell and the dashboard).

export const KINDS = [
  { id: "update", name: "Update", emoji: "📣", color: "#8ab4ff" },
  { id: "new", name: "New", emoji: "✨", color: "#34d399" },
  { id: "promo", name: "Offer", emoji: "🎁", color: "#f59e0b" },
  { id: "alert", name: "Important", emoji: "⚠️", color: "#ef4444" },
  { id: "event", name: "Event", emoji: "📅", color: "#c084fc" },
  { id: "info", name: "Info", emoji: "💬", color: "#38bdf8" },
] as const;
export type Kind = (typeof KINDS)[number]["id"];

export type Note = {
  key: string; title: string; body: string; kind: Kind; emoji: string; images: string[];
  ctaLabel: string; ctaUrl: string; accent: string; pinned: boolean; popup: boolean;
  status: "published" | "draft"; publishAt: number | null; expiresAt: number | null; rev: number; createdAt: number;
};

export const kindOf = (k: string) => KINDS.find((x) => x.id === k) ?? KINDS[0];
export const accentOf = (n: Pick<Note, "kind" | "accent">) => (/^#[0-9a-f]{6}$/i.test(n.accent) ? n.accent : kindOf(n.kind).color);
export const safeUrl = (u: string) => /^(https?:\/\/|mailto:|tel:)/i.test(u.trim());

export const emptyNote = (): Note => ({
  key: "", title: "", body: "", kind: "update", emoji: "", images: [], ctaLabel: "", ctaUrl: "", accent: "",
  pinned: false, popup: false, status: "published", publishAt: null, expiresAt: null, rev: Date.now(), createdAt: Date.now(),
});

const ms = (v: unknown): number | null => { const n = typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) : NaN; return Number.isFinite(n) && n > 0 ? n : null; };

// Whatever comes in (form, database, saved JSON) becomes a safe, complete note.
export function cleanNote(raw: unknown): Note {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const kind = KINDS.some((k) => k.id === o.kind) ? (o.kind as Kind) : "update";
  const images = Array.isArray(o.images) ? (o.images as unknown[]).filter((u): u is string => typeof u === "string" && /^https:\/\//i.test(u)).slice(0, 6) : [];
  const cta = str(o.ctaUrl, 500).trim();
  return {
    key: str(o.key, 64).replace(/[^\w-]/g, ""),
    title: str(o.title, 120).trim(), body: str(o.body, 4000), kind, emoji: Array.from(str(o.emoji, 16)).slice(0, 2).join(""),
    images, ctaLabel: str(o.ctaLabel, 40).trim(), ctaUrl: safeUrl(cta) ? cta : "",
    accent: /^#[0-9a-f]{6}$/i.test(str(o.accent, 7)) ? str(o.accent, 7) : "",
    pinned: !!o.pinned, popup: !!o.popup, status: o.status === "draft" ? "draft" : "published",
    publishAt: ms(o.publishAt), expiresAt: ms(o.expiresAt), rev: ms(o.rev) ?? Date.now(), createdAt: ms(o.createdAt) ?? Date.now(),
  };
}

export type DbNote = {
  uid: string; title: string; body: string; kind: string; emoji: string; images: string[]; ctaLabel: string; ctaUrl: string; accent: string;
  pinned: boolean; popup: boolean; status: string; publishAt: Date | null; expiresAt: Date | null; rev: Date; createdAt: Date;
};
export const fromDbNote = (r: DbNote): Note => cleanNote({ ...r, key: r.uid, publishAt: r.publishAt?.getTime(), expiresAt: r.expiresAt?.getTime(), rev: r.rev.getTime(), createdAt: r.createdAt.getTime() });

// Which posts a visitor can see right now.
export const isLive = (n: Note, now = Date.now()) => n.status === "published" && (!n.publishAt || n.publishAt <= now) && (!n.expiresAt || n.expiresAt > now);
export const sortNotes = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || (b.publishAt ?? b.createdAt) - (a.publishAt ?? a.createdAt);

export function ago(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString([], { month: "short", day: "numeric", year: d > 300 ? "numeric" : undefined });
}

export const SAMPLES: Partial<Note>[] = [
  { kind: "new", emoji: "✨", pinned: true, title: "Welcome to my new page", body: "Thanks for stopping by!\n\n**What's here**\n- All my links in one place\n- New drops posted right here\n- Tap the bell any time to catch up\n\n!tip Tap **Mark all read** to clear the dot." },
  { kind: "promo", emoji: "🎁", title: "Limited drop this weekend", body: "A small thank you to everyone who follows along.\n\n> Be early. These don't last.\n\n1. Tap the button below\n2. Pick your favorite\n3. Enjoy ==20% off== until Sunday", ctaLabel: "Open the drop", ctaUrl: "https://example.com" },
  { kind: "alert", emoji: "⚠️", title: "Heads up", body: "I'm travelling next week, so replies may be slow.\n\n!warn Please don't send urgent requests to DMs until the 20th.\n\n---\n\nBack to normal after that. Thank you for understanding." },
];
