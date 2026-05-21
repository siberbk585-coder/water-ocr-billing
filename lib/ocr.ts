import { createWorker, type Worker, PSM, OEM } from "tesseract.js";
import sharp from "sharp";
import { env } from "./env";
import { cropMeterRegion } from "./meterDetect";

export type OcrResult = {
  rawText: string;
  value: number | null;
  confidence: number;
};

/** Giữ worker sống — tránh tải lại model WASM mỗi lần quét (~10–30s). */
let workerReady: Promise<Worker> | null = null;

function getOcrWorker(): Promise<Worker> {
  if (!workerReady) {
    workerReady = (async () => {
      const worker = await createWorker("eng", OEM.LSTM_ONLY, {
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789.",
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return worker;
    })().catch((err) => {
      workerReady = null;
      throw err;
    });
  }
  return workerReady;
}

/** Thu nhỏ + grayscale để OCR nhanh hơn trên ảnh điện thoại. */
export async function preprocessMeterImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
    .grayscale()
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer();
}

function extractMeterValue(text: string): number | null {
  const normalized = text.replace(/,/g, ".");
  const withDecimal = normalized.match(/\b(\d{2,6})[.\s](\d{1,2})\b/);
  if (withDecimal) {
    const v = parseFloat(`${withDecimal[1]}.${withDecimal[2]}`);
    if (!Number.isNaN(v) && v >= 0 && v < 1_000_000) return v;
  }

  const digits = normalized.match(/\d[\d.]*/g);
  if (!digits?.length) return null;

  const candidates = digits
    .map((d) => parseFloat(d.replace(/[^\d.]/g, "")))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n < 1_000_000);

  if (!candidates.length) return null;

  const inMeterRange = candidates.filter((n) => n >= 1 && n <= 999999);
  const pool = inMeterRange.length ? inMeterRange : candidates;
  return pool.sort((a, b) => {
    const score = (n: number) => {
      const len = String(Math.floor(n)).length;
      const lenScore = len >= 4 && len <= 6 ? 10 : 0;
      return lenScore + Math.min(n, 99999);
    };
    return score(b) - score(a);
  })[0];
}

export async function runOcrOnImage(buffer: Buffer): Promise<OcrResult> {
  const { cropped } = await cropMeterRegion(buffer);
  const prepared = await preprocessMeterImage(cropped);
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(prepared);
  const rawText = data.text.trim();
  const value = extractMeterValue(rawText);
  const confidence = data.confidence ?? 0;
  return { rawText, value, confidence };
}

export function needsManualEntry(confidence: number): boolean {
  return confidence < env.ocrThreshold();
}

/** Dev: nạp model sẵn khi server khởi động để lần quét đầu không chờ ~10s. */
if (process.env.NODE_ENV === "development") {
  getOcrWorker().catch(() => {});
}
