import fs from "fs/promises";
import path from "path";
import { env } from "./env";

function storageRoot(): string {
  return path.resolve(process.cwd(), env.storageDir());
}

export async function ensureStorageSubdir(subdir: string): Promise<string> {
  const dir = path.join(storageRoot(), subdir);
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
