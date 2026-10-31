import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

// Quick pre-flight so the dashboard can explain problems instead of hanging.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  return NextResponse.json({ ok: true, blob: !!process.env.BLOB_READ_WRITE_TOKEN });
}

// Browser uploads straight to Blob (up to 10 MB), so Vercel's small request-body limit never applies.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
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
