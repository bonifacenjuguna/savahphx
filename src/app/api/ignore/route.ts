import { ignoreToken } from "@/lib/auth";

// Open this private link on any device you want left out of your stats (e.g. a test phone).
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (!process.env.SESSION_SECRET || t !== ignoreToken()) return new Response("Invalid link", { status: 403 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#0b0d12;color:#eef1f8;display:grid;place-items:center;min-height:100vh;margin:0"><p>This device is now excluded from your stats.</p>',
    { headers: { "content-type": "text/html; charset=utf-8", "set-cookie": `ig=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}` } },
  );
}
