export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing env: ${key}`);
  return value;
}

export const env = {
  sessionSecret: () => getEnv("SESSION_SECRET", "dev-secret"),
  ocrThreshold: () => Number(getEnv("OCR_CONFIDENCE_THRESHOLD", "70")),
  defaultUnitPrice: () => Number(getEnv("DEFAULT_UNIT_PRICE", "15000")),
  storageDir: () => getEnv("STORAGE_DIR", "storage"),
  googleSheetsEnabled: () => getEnv("GOOGLE_SHEETS_ENABLED", "false") === "true",
};
