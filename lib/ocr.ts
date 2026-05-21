import Tesseract from "tesseract.js";
import { env } from "./env";

export type OcrResult = {
  rawText: string;
  value: number | null;
  confidence: number;
};

function extractMeterValue(text: string): number | null {
  const digits = text.replace(/[^\d.,]/g, " ").match(/\d[\d.,]*/g);
  if (!digits?.length) return null;
  const candidates = digits
    .map((d) => parseFloat(d.replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  if (!candidates.length) return null;
  return candidates.sort((a, b) => b - a)[0];
}

export async function runOcrOnImage(buffer: Buffer): Promise<OcrResult> {
  const { data } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });
  const rawText = data.text.trim();
  const value = extractMeterValue(rawText);
  const confidence = data.confidence ?? 0;
  return { rawText, value, confidence };
}

export function needsManualEntry(confidence: number): boolean {
  return confidence < env.ocrThreshold();
}
