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
    key: r.uid ?? `id-${r.id}`, platform, handle, title: r.title, url: r.url,
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
