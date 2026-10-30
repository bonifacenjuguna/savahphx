import { boolean, integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import type { Settings } from "@/lib/theme";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("card"), // "card" | "social"
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon"), // Simple Icons slug, e.g. "instagram"
  image: text("image"), // custom image URL (overrides icon)
  width: text("width").notNull().default("full"), // "full" | "half"
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  uid: text("uid"), // stable key used by shortcuts
  shortcutOf: text("shortcut_of"), // legacy (v2)
  platform: text("platform"),
  handle: text("handle"),
  asIcon: boolean("as_icon").notNull().default(false),
  color: boolean("color").notNull().default(false),
  shape: text("shape"),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Settings>().notNull(),
});
