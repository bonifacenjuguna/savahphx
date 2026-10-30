import { boolean, integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import type { Settings } from "@/lib/theme";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("card"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  image: text("image"),
  width: text("width").notNull().default("full"),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  shortcut: boolean("shortcut").notNull().default(false),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<Settings>().notNull(),
});
