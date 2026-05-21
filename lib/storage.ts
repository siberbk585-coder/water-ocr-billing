import fs from "fs/promises";
import path from "path";
import { env } from "./env";

/** Vercel/Lambda: chỉ `/tmp` ghi được; local dev: thư mục project. */
function isServerlessFs(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function storageRoot(): string {
  const configured = env.storageDir().replace(/^\/+/, "");
  if (isServerlessFs()) {
    if (configured.startsWith("tmp/") || configured === "tmp") {
      return path.join("/tmp", configured === "tmp" ? "water-ocr-storage" : configured.slice(4));
    }
    return path.join("/tmp", configured || "water-ocr-storage");
  }
  return path.resolve(process.cwd(), configured || "storage");
}

export async function ensureStorageSubdir(subdir: string): Promise<string> {
  const root = storageRoot();
  const dir = path.join(root, subdir);
  // #region agent log
  fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
    body: JSON.stringify({
      sessionId: "eeecce",
      hypothesisId: "H-storage",
      location: "lib/storage.ts:ensureStorageSubdir",
      message: "mkdir storage",
      data: {
        root,
        dir,
        serverless: isServerlessFs(),
        cwd: process.cwd(),
        vercel: process.env.VERCEL,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveBuffer(
  subdir: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const dir = await ensureStorageSubdir(subdir);
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, data);
  return path.join(subdir, filename);
}

export function resolveStoragePath(relativePath: string): string {
  return path.join(storageRoot(), relativePath);
}

export async function readStorageFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(resolveStoragePath(relativePath));
}
