export type AnomalyCode =
  | "NEGATIVE_USAGE"
  | "HIGH_USAGE"
  | "ZERO_USAGE"
  | "NEW_CUSTOMER";

export type AnomalyResult = {
  flags: AnomalyCode[];
  reject: boolean;
  message?: string;
};

export function detectAnomalies(params: {
  oldReading: number;
  newReading: number;
  avgUsage3Months: number | null;
}): AnomalyResult {
  const { oldReading, newReading, avgUsage3Months } = params;
  const flags: AnomalyCode[] = [];
  const usage = newReading - oldReading;

  if (newReading < oldReading) {
    return {
      flags: ["NEGATIVE_USAGE"],
      reject: true,
      message: "Chỉ số mới nhỏ hơn chỉ số kỳ trước — không thể lưu.",
    };
  }

  if (avgUsage3Months === null) {
    flags.push("NEW_CUSTOMER");
  } else {
    if (usage === 0) flags.push("ZERO_USAGE");
    if (avgUsage3Months > 0 && usage > avgUsage3Months * 2) {
      flags.push("HIGH_USAGE");
    }
  }

  return { flags, reject: false };
}

export function parseAnomalyFlags(json: string): AnomalyCode[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed as AnomalyCode[]) : [];
  } catch {
    return [];
  }
}
