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
  })().catch((e) => {
    done = undefined; // retry on next request
    throw e;
  });
  return done;
}
