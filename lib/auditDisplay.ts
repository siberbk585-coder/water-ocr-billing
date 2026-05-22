import { calculateUsage } from "./billing";

/** Nhãn tiếng Việt cho khóa metadata nhật ký. */
const META_LABELS: Record<string, string> = {
  maHo: "Mã hộ",
  mkh: "Đồng hồ",
  csc: "CSC",
  csm: "CSM",
  tieuThu: "Tiêu thụ",
  coAnh: "Ảnh",
  lyDo: "Lý do",
  periodId: "Kỳ",
  amount: "Số tiền",
  count: "Số lượng",
  staleActorId: "Actor cũ",
};

function formatMetaValue(key: string, v: unknown): string {
  if (v == null || v === "") return "";
  if (key === "coAnh" && typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "number" && (key === "csc" || key === "csm" || key === "tieuThu")) {
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

export function isEmptyAuditMetadata(raw: string | null | undefined): boolean {
  if (!raw || raw === "{}") return true;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return !Object.entries(obj).some(([, v]) => v != null && v !== "");
  } catch {
    return false;
  }
}

export function formatAuditMetadata(raw: string): string {
  if (isEmptyAuditMetadata(raw)) return "—";
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const parts = Object.entries(obj)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => {
        const label = META_LABELS[k] ?? k;
        const val = formatMetaValue(k, v);
        if (!val) return "";
        return `${label}: ${val}${k === "tieuThu" ? " m³" : ""}`;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  } catch {
    return raw.slice(0, 80);
  }
}

export function meterReadingAuditMetadata(
  reading: {
    oldReading: number;
    confirmedValue: number | null;
    usageM3: number | null;
    imagePath?: string | null;
  },
  household: { householdCode: string; meterCode: string },
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const csm = reading.confirmedValue;
  const tieuThu =
    reading.usageM3 ??
    (csm != null ? calculateUsage(csm, reading.oldReading) : undefined);
  return {
    maHo: household.householdCode,
    mkh: household.meterCode,
    csc: reading.oldReading,
    ...(csm != null ? { csm } : {}),
    ...(tieuThu != null ? { tieuThu } : {}),
    ...(reading.imagePath ? { coAnh: true } : {}),
    ...extra,
  };
}

export function formatMeterReadingAuditDetail(
  reading: {
    oldReading: number;
    confirmedValue: number | null;
    usageM3: number | null;
    imagePath?: string | null;
  },
  household: { householdCode: string; meterCode: string }
): string {
  return formatAuditMetadata(
    JSON.stringify(meterReadingAuditMetadata(reading, household))
  );
}
