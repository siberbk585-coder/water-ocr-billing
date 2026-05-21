import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { postImageToN8nWebhook, n8nImageWebhookUrl } from "./n8nWebhook";
import { saveBuffer } from "./storage";

export type ImageUploadResult = {
  url: string;
  pathname: string;
  storage: "n8n-webhook" | "vercel-blob" | "local";
};

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001")
  );
}

/** Upload ảnh — ưu tiên n8n webhook, rồi Blob, rồi local. */
export async function uploadImageBuffer(
  buffer: Buffer,
  opts?: {
    filename?: string;
    contentType?: string;
    householdId?: string;
    periodId?: string;
    householdCode?: string;
    confirmedValue?: number;
  }
): Promise<ImageUploadResult> {
  const contentType = opts?.contentType ?? "image/jpeg";
  const ext = opts?.filename?.split(".").pop() || extFromContentType(contentType);
  const filename = opts?.filename ?? `meter-${randomUUID()}.${ext}`;

  if (n8nImageWebhookUrl()) {
    const n8n = await postImageToN8nWebhook(buffer, {
      filename,
      contentType,
      householdId: opts?.householdId,
      periodId: opts?.periodId,
      householdCode: opts?.householdCode,
      confirmedValue: opts?.confirmedValue,
    });
    return { url: n8n.url, pathname: n8n.url, storage: "n8n-webhook" };
  }

  const pathname = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, pathname: blob.pathname, storage: "vercel-blob" };
  }

  const relative = await saveBuffer("uploads", `${randomUUID()}.${ext}`, buffer);
  const url = `${appBaseUrl()}/api/files/${relative}`;
  return { url, pathname: relative, storage: "local" };
}
