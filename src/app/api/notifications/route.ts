import { NextResponse } from "next/server";
import { loadLive } from "@/lib/notif-db";

// What visitors can see right now. The bell on the page asks for this when it opens and when the tab comes back.
export async function GET() {
  try {
    return NextResponse.json({ items: await loadLive() }, { headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
