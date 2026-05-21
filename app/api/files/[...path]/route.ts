import { NextResponse } from "next/server";
import { readStorageFile } from "@/lib/storage";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const relative = path.join("/");
  try {
    const buf = await readStorageFile(relative);
    const ext = relative.split(".").pop()?.toLowerCase() ?? "jpg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });
  }
}
