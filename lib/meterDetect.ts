import sharp from "sharp";
import { env } from "./env";

export type DetectBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  className?: string;
};

type RoboflowPrediction = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class?: string;
};

/**
 * Bước 1: Roboflow (Workflow Serverless hoặc Detect API cũ) → cắt vùng đồng hồ → Tesseract.
 */
export async function cropMeterRegion(buffer: Buffer): Promise<{
  cropped: Buffer;
  box: DetectBox | null;
}> {
  if (!env.meterDetectEnabled()) {
    return { cropped: buffer, box: null };
  }

  const box = await detectMeterBox(buffer);
  if (!box) {
    return { cropped: buffer, box: null };
  }

  const cropped = await extractBox(buffer, box);
  return { cropped, box };
}

async function detectMeterBox(buffer: Buffer): Promise<DetectBox | null> {
  const workflow = env.roboflowWorkflowEndpoint();
  if (workflow) {
    const fromWorkflow = await detectWithRoboflowWorkflow(buffer, workflow);
    if (fromWorkflow) return fromWorkflow;
  }
  return detectWithRoboflowLegacy(buffer);
}

/** Roboflow Workflow — khớp màn "Deploy Workflow" (Serverless Hosted API). */
async function detectWithRoboflowWorkflow(
  buffer: Buffer,
  endpoint: string
): Promise<DetectBox | null> {
  const apiKey = env.roboflowApiKey();
  if (!apiKey) return null;

  const base64 = buffer.toString("base64");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      inputs: {
        image: { type: "base64", value: base64 },
      },
    }),
  });

  if (!res.ok) {
    console.warn("Roboflow workflow failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  return pickBestBox(collectPredictions(data));
}

/** Detect API cũ: https://detect.roboflow.com/... */
async function detectWithRoboflowLegacy(buffer: Buffer): Promise<DetectBox | null> {
  const apiKey = env.roboflowApiKey();
  const detectUrl = env.roboflowDetectUrl();
  if (!apiKey || !detectUrl) return null;

  const url = detectUrl.includes("api_key=")
    ? detectUrl
    : `${detectUrl}${detectUrl.includes("?") ? "&" : "?"}api_key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    console.warn("Roboflow detect failed:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = (await res.json()) as { predictions?: RoboflowPrediction[] };
  return pickBestBox(data.predictions ?? []);
}

function collectPredictions(root: unknown): RoboflowPrediction[] {
  const found: RoboflowPrediction[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const r = node as Record<string, unknown>;
    if (
      typeof r.x === "number" &&
      typeof r.y === "number" &&
      typeof r.width === "number" &&
      typeof r.height === "number"
    ) {
      found.push({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        confidence: typeof r.confidence === "number" ? r.confidence : 0,
        class: typeof r.class === "string" ? r.class : undefined,
      });
    }
    Object.values(r).forEach(walk);
  }

  walk(root);
  return found;
}

function pickBestBox(preds: RoboflowPrediction[]): DetectBox | null {
  if (!preds.length) return null;

  const targetClass = env.roboflowDetectClass();
  const filtered = targetClass ? preds.filter((p) => p.class === targetClass) : preds;
  const pool = filtered.length ? filtered : preds;

  const best = pool.sort((a, b) => b.confidence - a.confidence)[0];
  return {
    x: best.x,
    y: best.y,
    width: best.width,
    height: best.height,
    confidence: best.confidence,
    className: best.class,
  };
}

async function extractBox(buffer: Buffer, box: DetectBox): Promise<Buffer> {
  const meta = await sharp(buffer).metadata();
  const imgW = meta.width ?? 0;
  const imgH = meta.height ?? 0;
  if (!imgW || !imgH) return buffer;

  const pad = 0.08;
  const w = box.width * (1 + pad);
  const h = box.height * (1 + pad);
  const left = Math.max(0, Math.floor(box.x - w / 2));
  const top = Math.max(0, Math.floor(box.y - h / 2));
  const width = Math.min(imgW - left, Math.ceil(w));
  const height = Math.min(imgH - top, Math.ceil(h));

  if (width < 20 || height < 20) return buffer;

  return sharp(buffer).extract({ left, top, width, height }).png().toBuffer();
}
