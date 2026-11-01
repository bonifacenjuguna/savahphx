import { neon } from "@neondatabase/serverless";

// Self-healing schema: creates missing tables/columns so the app works however it is deployed or run.
let done: Promise<void> | undefined;

export function ensureSchema() {
  done ??= (async () => {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`CREATE TABLE IF NOT EXISTS links (
      id serial PRIMARY KEY, kind text NOT NULL DEFAULT 'card', title text NOT NULL, url text NOT NULL,
      icon text, image text, width text NOT NULL DEFAULT 'full', position integer NOT NULL DEFAULT 0,
      visible boolean NOT NULL DEFAULT true)`;
    await sql`CREATE TABLE IF NOT EXISTS settings (id integer PRIMARY KEY, data jsonb NOT NULL)`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS uid text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS shortcut_of text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS platform text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS handle text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS as_icon boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS color boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS shape text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'link'`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS body text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS network text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS memo text`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS qr boolean NOT NULL DEFAULT true`;
    await sql`ALTER TABLE links ADD COLUMN IF NOT EXISTS tall integer NOT NULL DEFAULT 1`;
    await sql`CREATE TABLE IF NOT EXISTS events (
      id serial PRIMARY KEY, t text NOT NULL, k text, title text, v text NOT NULL, at timestamptz NOT NULL DEFAULT now(),
      country text, city text, device text, os text, browser text, ref text, lang text)`;
    await sql`CREATE INDEX IF NOT EXISTS events_at_idx ON events (at)`;
    await sql`CREATE INDEX IF NOT EXISTS events_k_idx ON events (k)`;
    await sql`CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY, title text NOT NULL, excerpt text, body text NOT NULL, image text,
      category text NOT NULL DEFAULT 'Announcement', status text NOT NULL DEFAULT 'draft',
      pinned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_published_idx ON notifications (status, published_at DESC)`;
  })().catch((e) => {
    done = undefined; // retry on next request
    throw e;
  });
  return done;
}
