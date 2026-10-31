import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

// Quick pre-flight so the dashboard can explain problems instead of hanging.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  return NextResponse.json({ ok: true, blob: !!process.env.BLOB_READ_WRITE_TOKEN });
}

// Browser uploads straight to Blob (up to 10 MB), so Vercel's small request-body limit never applies.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body, request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Unauthorized");
        return { allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"], maximumSizeInBytes: 10 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// Main lane: the browser sends the (already shrunk) image here and the server stores it in Blob.
// No token handshake and no completion callback, so there is nothing that can hang half way.
// Vercel allows about 4.5 MB per request body; the dashboard shrinks photos far below that.
export const maxDuration = 30;
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF or AVIF image." }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Image storage is not connected. In Vercel open Storage, create a Blob store, connect it to this project and redeploy." }, { status: 400 });
  const name = (new URL(request.url).searchParams.get("name") ?? "image").replace(/[^\w.-]/g, "_").slice(0, 80);
  try {
    const buf = Buffer.from(await request.arrayBuffer());
    if (!buf.length) return NextResponse.json({ error: "The image arrived empty. Try again." }, { status: 400 });
    if (buf.length > 4_500_000) return NextResponse.json({ error: "Image is too big for this lane." }, { status: 413 });
    const b = await put(`img/${name}`, buf, { access: "public", contentType: type, addRandomSuffix: true, abortSignal: AbortSignal.timeout(25000) });
    return NextResponse.json({ url: b.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
