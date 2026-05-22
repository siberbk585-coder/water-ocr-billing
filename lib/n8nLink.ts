export const N8N_LINK_KEYS = [
  "webContentLink",
  "webViewLink",
  "url",
  "pdfUrl",
  "imageUrl",
  "downloadUrl",
  "fileUrl",
  "link",
] as const;

function isHttpUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

function linkFromObject(o: Record<string, unknown>): string | null {
  for (const key of N8N_LINK_KEYS) {
    if (isHttpUrl(o[key])) return o[key];
  }
  return null;
}

/** Trích link từ JSON response webhook n8n. */
export function extractUrlFromN8nResponse(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") {
    if (isHttpUrl(data)) return data;
    try {
      return extractUrlFromN8nResponse(JSON.parse(data));
    } catch {
      return null;
    }
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const u = extractUrlFromN8nResponse(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    const direct = linkFromObject(o);
    if (direct) return direct;
    if (o.body && typeof o.body === "object") {
      const u = linkFromObject(o.body as Record<string, unknown>);
      if (u) return u;
    }
    if (o.json) {
      const u = extractUrlFromN8nResponse(o.json);
      if (u) return u;
    }
  }
  return null;
}
