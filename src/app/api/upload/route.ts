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

// Fallback lane: if the direct browser-to-Blob upload keeps stalling on a bad connection, the dashboard
// sends the (already shrunk) image through here instead. Vercel allows about 4.5 MB per request body.
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF or AVIF image." }, { status: 400 });
  const name = (new URL(request.url).searchParams.get("name") ?? "image").replace(/[^\w.-]/g, "_").slice(0, 80);
  try {
    const b = await put(`img/${name}`, request.body as ReadableStream, { access: "public", contentType: type, addRandomSuffix: true });
    return NextResponse.json({ url: b.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
