import { InputMethod, ReadingStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { detectAnomalies } from "./anomaly";
import { calculateUsage } from "./billing";
import { saveBuffer } from "./storage";
import { logAudit } from "./audit";

export async function getAvgUsage3Months(
  householdId: string,
  beforePeriodId: string
): Promise<number | null> {
  const before = await prisma.billingPeriod.findUnique({ where: { id: beforePeriodId } });
  if (!before) return null;

  const prior = await prisma.meterReading.findMany({
    where: {
      householdId,
      status: ReadingStatus.CONFIRMED,
      period: {
        OR: [
          { year: { lt: before.year } },
          { year: before.year, month: { lt: before.month } },
        ],
      },
    },
    include: { period: true },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
    take: 3,
  });

  const usages = prior.map((r) => r.usageM3).filter((u): u is number => u != null);
  if (!usages.length) return null;
  return usages.reduce((a, b) => a + b, 0) / usages.length;
}

export async function getOldReading(householdId: string, periodId: string): Promise<number> {
  const period = await prisma.billingPeriod.findUniqueOrThrow({ where: { id: periodId } });
  const prev = await prisma.meterReading.findFirst({
    where: {
      householdId,
      status: ReadingStatus.CONFIRMED,
      period: {
        OR: [
          { year: { lt: period.year } },
          { year: period.year, month: { lt: period.month } },
        ],
      },
    },
    include: { period: true },
    orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
  });
  if (prev?.confirmedValue != null) return prev.confirmedValue;
  const household = await prisma.household.findUniqueOrThrow({ where: { id: householdId } });
  const base = parseInt(household.meterCode.replace(/\D/g, "").slice(-3) || "100", 10);
  return 100 + (base % 50);
}

export async function confirmReading(params: {
  readingId: string;
  confirmedValue: number;
  inputMethod: InputMethod;
  actorId?: string;
}) {
  const reading = await prisma.meterReading.findUniqueOrThrow({
    where: { id: params.readingId },
    include: { household: true, period: true },
  });

  const avg = await getAvgUsage3Months(reading.householdId, reading.periodId);
  const anomaly = detectAnomalies({
    oldReading: reading.oldReading,
    newReading: params.confirmedValue,
    avgUsage3Months: avg,
  });

  if (anomaly.reject) {
    await prisma.meterReading.update({
      where: { id: reading.id },
      data: { status: ReadingStatus.REJECTED, anomalyFlags: JSON.stringify(anomaly.flags) },
    });
    throw new Error(anomaly.message ?? "Không thể lưu chỉ số");
  }

  const usageM3 = calculateUsage(params.confirmedValue, reading.oldReading);

  return prisma.meterReading.update({
    where: { id: reading.id },
    data: {
      confirmedValue: params.confirmedValue,
      inputMethod: params.inputMethod,
      usageM3,
      anomalyFlags: JSON.stringify(anomaly.flags),
      status: ReadingStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });
}

/** Gửi ảnh + chỉ số nhập tay — không cần OCR (luồng chính MVP). */
export async function submitManualReading(params: {
  householdId: string;
  periodId: string;
  confirmedValue: number;
  imageBuffer: Buffer;
  fileExt: string;
  actorId?: string;
}) {
  const [oldReading, imagePath] = await Promise.all([
    getOldReading(params.householdId, params.periodId),
    saveBuffer("readings", `${randomUUID()}.${params.fileExt}`, params.imageBuffer),
  ]);

  const existing = await prisma.meterReading.findUnique({
    where: {
      householdId_periodId: {
        householdId: params.householdId,
        periodId: params.periodId,
      },
    },
  });

  const draft = existing
    ? await prisma.meterReading.update({
        where: { id: existing.id },
        data: {
          oldReading,
          imagePath,
          status: ReadingStatus.PENDING,
          anomalyFlags: "[]",
        },
      })
    : await prisma.meterReading.create({
        data: {
          householdId: params.householdId,
          periodId: params.periodId,
          oldReading,
          imagePath,
          status: ReadingStatus.PENDING,
          anomalyFlags: "[]",
        },
      });

  const reading = await confirmReading({
    readingId: draft.id,
    confirmedValue: params.confirmedValue,
    inputMethod: InputMethod.MANUAL,
    actorId: params.actorId,
  });

  if (params.actorId) {
    await logAudit({
      actorId: params.actorId,
      action: "READING_CONFIRMED",
      entity: "MeterReading",
      entityId: reading.id,
    });
  }

  return reading;
}
