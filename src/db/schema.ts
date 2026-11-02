import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { Block } from "../lib/notifs";

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
  shortcut: text("shortcut"), // legacy (v1) column some databases still carry; declared so drizzle never offers to drop it
  platform: text("platform"),
  handle: text("handle"),
  asIcon: boolean("as_icon").notNull().default(false),
  color: boolean("color").notNull().default(false),
  shape: text("shape"),
  type: text("type").notNull().default("link"), // link | text | wallet
  body: text("body"),
  network: text("network"),
  memo: text("memo"),
  qr: boolean("qr").notNull().default(true),
  tall: integer("tall").notNull().default(1), // card height: 1 | 2 | 3 rows
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  t: text("t").notNull(), // view | click | icon | copy | copylink | open | share | nview | nclick
  k: text("k"), title: text("title"), v: text("v").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  country: text("country"), city: text("city"), device: text("device"), os: text("os"),
  browser: text("browser"), ref: text("ref"), lang: text("lang"),
});

// Notifications you post from the dashboard. Visitors see the live ones behind the bell.
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  kind: text("kind").notNull().default("info"),
  color: text("color"),
  image: text("image"),
  blocks: jsonb("blocks").$type<Block[]>().notNull().default([]),
  cta: text("cta"),
  ctaUrl: text("cta_url"),
  pinned: boolean("pinned").notNull().default(false),
  quiet: boolean("quiet").notNull().default(false),
  status: text("status").notNull().default("published"), // published | draft
  publishAt: timestamp("publish_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  rev: integer("rev").notNull().default(1),
});
