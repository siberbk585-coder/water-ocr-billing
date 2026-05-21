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
  meterDetectEnabled: () => process.env.METER_DETECT_ENABLED === "true",
  roboflowApiKey: () => process.env.ROBOFLOW_API_KEY ?? "",
  roboflowDetectUrl: () => process.env.ROBOFLOW_DETECT_URL ?? "",
  roboflowDetectClass: () => process.env.ROBOFLOW_DETECT_CLASS ?? "",
  /** URL đầy đủ hoặc ghép từ workspace + workflow id */
  roboflowWorkflowEndpoint: () => {
    const direct = process.env.ROBOFLOW_WORKFLOW_URL?.trim();
    if (direct) return direct;
    const ws = process.env.ROBOFLOW_WORKSPACE?.trim();
    const wf = process.env.ROBOFLOW_WORKFLOW_ID?.trim();
    if (ws && wf) {
      return `https://serverless.roboflow.com/infer/workflows/${ws}/${wf}`;
    }
    return "";
  },
};
