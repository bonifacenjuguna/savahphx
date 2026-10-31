import type { links } from "@/db/schema";
import { byId, toHandle } from "./platforms";
import type { Row } from "./theme";

type DbRow = typeof links.$inferSelect;
const SHAPES = ["circle", "rounded", "square"];

const toRow = (r: DbRow): Row => {
  const platform = r.platform ?? (byId(r.icon ?? "") ? r.icon! : "custom");
  const p = byId(platform);
  const handle = r.handle ?? (p && p.kind !== "url" ? toHandle(p, r.url.replace(/^(mailto|tel):/, "")) : "");
  return {
    key: r.uid ?? `id-${r.id}`, type: r.type === "text" || r.type === "wallet" ? r.type : "link",
    body: r.body ?? "", network: r.network ?? "btc", memo: r.memo ?? "", qr: r.qr !== false,
    platform, handle, title: r.title, url: r.url,
    icon: r.icon && !byId(r.icon) ? r.icon : "", image: r.image ?? "",
    size: r.width === "half" ? "half" : r.width === "third" ? "third" : "full",
    visible: r.visible, asIcon: !!r.asIcon, color: !!r.color,
    shape: (SHAPES.includes(r.shape ?? "") ? r.shape : "") as Row["shape"],
  };
};

// v2 rows (separate icon rows / shortcuts) are folded into the single v3 model.
export function fromDb(rows: DbRow[]): Row[] {
  const out = rows.filter((r) => r.kind !== "social").map(toRow);
  for (const s of rows.filter((r) => r.kind === "social")) {
    const t = s.shortcutOf ? out.find((c) => c.key === s.shortcutOf) : undefined;
    if (t) { t.asIcon = true; if (s.icon && !t.icon && !byId(s.icon)) t.icon = s.icon; }
    else out.push({ ...toRow(s), visible: false, asIcon: s.visible });
  }
  return out;
}

export function cleanRow(x: unknown): Row {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const s = (v: unknown, m = 300) => (typeof v === "string" ? v.slice(0, m) : "");
  const img = s(o.image, 500);
  return {
    key: s(o.key, 64).replace(/[^\w-]/g, "") || crypto.randomUUID(), type: o.type === "text" || o.type === "wallet" ? o.type : "link",
    body: s(o.body, 1000), network: s(o.network, 30).replace(/[^a-z0-9-]/g, "") || "btc", memo: s(o.memo, 80), qr: o.qr !== false, platform: s(o.platform, 30), handle: s(o.handle, 200),
    title: s(o.title, 80), url: s(o.url, 500), icon: s(o.icon, 40).toLowerCase().replace(/[^a-z0-9]/g, ""),
    image: /^https:\/\//i.test(img) ? img : "", size: o.size === "half" || o.size === "third" ? o.size : "full",
    visible: o.visible !== false, asIcon: !!o.asIcon, color: !!o.color,
    shape: (SHAPES.includes(o.shape as string) ? o.shape : "") as Row["shape"],
  };
}
