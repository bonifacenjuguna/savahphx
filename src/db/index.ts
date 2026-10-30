import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Never throw at import time: a missing URL should fail inside a query (which pages catch), not crash the app.
export const db = drizzle(neon(process.env.DATABASE_URL ?? "postgres://missing:missing@localhost/missing"), { schema });
