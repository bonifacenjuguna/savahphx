import { get } from "@vercel/blob";

// Serves images from a private Blob store to your visitors. Only files under img/ are ever served.
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams.get("p") ?? "";
  if (!/^img\/[\w.\-]+$/.test(p)) return new Response("Not found", { status: 404 });
  try {
    const r = await get(p, { access: "private" });
    if (!r || r.statusCode !== 200 || !r.stream) return new Response("Not found", { status: 404 });
    return new Response(r.stream, {
      headers: {
        "content-type": r.blob.contentType || "application/octet-stream",
        "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
