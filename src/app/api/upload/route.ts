import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quick pre-flight: never let a cached response hide an expired admin session
// or a missing Blob store connection.
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { ok: true, blob: !!process.env.BLOB_READ_WRITE_TOKEN },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[image-upload] preflight failed", error);
    return NextResponse.json({ error: "Could not verify the upload session. Refresh the admin page and sign in again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

// The browser transfers the image directly to Blob; this route only authorizes it.
export async function POST(request: Request) {
  const started = Date.now();
  console.info("[image-upload] authorization request received");
  try {
    const body = (await request.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        console.info("[image-upload] checking admin session");
        if (!(await isAdmin())) {
          console.warn("[image-upload] authorization rejected: admin session invalid");
          throw new Error("Your admin session has expired. Sign in again and retry.");
        }
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error("Image storage is not connected. Connect a Vercel Blob store to this project and redeploy.");
        }
        console.info("[image-upload] generating Blob upload token");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        console.info("[image-upload] Blob upload completed", { elapsedMs: Date.now() - started });
      },
    });
    console.info("[image-upload] authorization response ready", { elapsedMs: Date.now() - started });
    return NextResponse.json(json, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[image-upload] authorization failed", {
      elapsedMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    const message = error instanceof Error ? error.message : "Image upload authorization failed.";
    const unauthorized = /unauthorized|session has expired/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
