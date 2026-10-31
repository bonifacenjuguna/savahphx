import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const maxDuration = 30;

// Quick pre-flight so the dashboard can explain problems instead of hanging.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  return NextResponse.json({ ok: true, blob: !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) });
}

const slow = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Image storage did not answer in time. Try again.")), ms))]);

// The browser sends the (already shrunk) image here and the server stores it in Blob.
// Works with both kinds of Blob store: private stores (images are then served to visitors through /api/img)
// and public stores (the plain public URL is used).
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF or AVIF image." }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return NextResponse.json({ error: "Image storage is not connected. In Vercel open Storage, create a Blob store, connect it to this project and redeploy." }, { status: 400 });
  const name = (new URL(request.url).searchParams.get("name") ?? "image").replace(/[^\w.-]/g, "_").slice(0, 80);
  const host = request.headers.get("x-forwarded-host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  try {
    const buf = Buffer.from(await request.arrayBuffer());
    if (!buf.length) return NextResponse.json({ error: "The image arrived empty. Try again." }, { status: 400 });
    if (buf.length > 4_500_000) return NextResponse.json({ error: "That image is over 4 MB. Use a smaller one." }, { status: 413 });
    const opts = { contentType: type, addRandomSuffix: true } as const;
    try {
      const b = await slow(put(`img/${name}`, buf, { ...opts, access: "private" }), 20000);
      return NextResponse.json({ url: `${proto}://${host}/api/img?p=${b.pathname}` });
    } catch (e) {
      // A public store rejects private writes; try the public way before giving up.
      if (!/access|public|private/i.test((e as Error).message)) throw e;
      const b = await slow(put(`img/${name}`, buf, { ...opts, access: "public" }), 20000);
      return NextResponse.json({ url: b.url });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
