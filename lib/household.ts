import type { Household, MeterReading, BillingPeriod, ReadingStatus } from "@prisma/client";
import { ReadingStatus as ReadingStatusEnum } from "@prisma/client";

export type HouseholdWithReadings = Household & {
  readings: (MeterReading & { period: BillingPeriod })[];
};

export function meterToHouseholdCode(meterCode: string): string {
  const digits = meterCode.replace(/^DH/i, "");
  return `HH${digits.padStart(5, "0")}`;
}

export function latestReading(readings: HouseholdWithReadings["readings"]) {
  if (!readings.length) return null;
  return [...readings].sort((a, b) => {
    if (a.period.year !== b.period.year) return b.period.year - a.period.year;
    return b.period.month - a.period.month;
  })[0];
}

export function readingCounts(readings: { status: ReadingStatus }[]) {
  return {
    total: readings.length,
    pending: readings.filter((r) => r.status === ReadingStatusEnum.PENDING).length,
    confirmed: readings.filter((r) => r.status === ReadingStatusEnum.CONFIRMED).length,
  };
}
