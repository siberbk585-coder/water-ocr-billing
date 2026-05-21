import { randomUUID } from "crypto";

export type N8nImageUploadResult = {
  url: string;
  raw?: unknown;
};

const DEFAULT_WEBHOOK = "https://iatzhxxuk.tino.page/webhook/luuhinhanh";

export function n8nImageWebhookUrl(): string | null {
  if (process.env.N8N_IMAGE_WEBHOOK_DISABLED === "true") return null;
  return process.env.N8N_IMAGE_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK;
}

function extractUrl(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return extractUrl(JSON.parse(data));
    } catch {
      return null;
    }
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const u = extractUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.url === "string" && o.url.startsWith("http")) return o.url;
    if (typeof o.imageUrl === "string" && o.imageUrl.startsWith("http")) return o.imageUrl;
    if (o.body) {
      const u = extractUrl(o.body);
      if (u) return u;
    }
    if (o.json) {
      const u = extractUrl(o.json);
      if (u) return u;
    }
  }
  return null;
}

/** Gửi ảnh lên webhook n8n — workflow n8n trả `url` (Respond to Webhook). */
export async function postImageToN8nWebhook(
  buffer: Buffer,
  meta?: {
    filename?: string;
    contentType?: string;
    householdId?: string;
    periodId?: string;
    householdCode?: string;
    confirmedValue?: number;
  }
): Promise<N8nImageUploadResult> {
  const webhookUrl = n8nImageWebhookUrl();
  if (!webhookUrl) {
    throw new Error("Chưa cấu hình N8N_IMAGE_WEBHOOK_URL");
  }

  const contentType = meta?.contentType ?? "image/jpeg";
  const filename = meta?.filename ?? `meter-${randomUUID()}.jpg`;

  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(buffer)], { type: contentType }), filename);
  form.append("filename", filename);
  form.append("content_type", contentType);
  form.append("source", "water-ocr-billing");
  if (meta?.householdId) form.append("householdId", meta.householdId);
  if (meta?.periodId) form.append("periodId", meta.periodId);
  if (meta?.householdCode) form.append("householdCode", meta.householdCode);
  if (meta?.confirmedValue != null) form.append("confirmedValue", String(meta.confirmedValue));

  const res = await fetch(webhookUrl, {
    method: "POST",
    body: form,
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    throw new Error(`n8n webhook HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const url = extractUrl(parsed);
  if (!url) {
    throw new Error(
      "n8n webhook không trả url. Thêm node Respond to Webhook với body: { \"url\": \"...\" }"
    );
  }

  return { url, raw: parsed };
}
