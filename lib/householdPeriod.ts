import type {
  BillingPeriod,
  Invoice,
  MeterReading,
  Payment,
} from "@prisma/client";

export type HouseholdPeriodBundle = {
  period: BillingPeriod;
  reading: MeterReading | null;
  invoice: (Invoice & { payment: Payment | null }) | null;
};

/** Gộp chỉ số + hóa đơn theo từng kỳ (tháng), kể cả kỳ chưa có dữ liệu hộ. */
export function buildHouseholdPeriodTimeline(
  allPeriods: BillingPeriod[],
  readings: MeterReading[],
  invoices: (Invoice & { payment: Payment | null })[]
): HouseholdPeriodBundle[] {
  const readingByPeriod = new Map(readings.map((r) => [r.periodId, r]));
  const invoiceByPeriod = new Map(invoices.map((i) => [i.periodId, i]));

  return allPeriods.map((period) => ({
    period,
    reading: readingByPeriod.get(period.id) ?? null,
    invoice: invoiceByPeriod.get(period.id) ?? null,
  }));
}

export function splitTimelineByPeriodStatus(rows: HouseholdPeriodBundle[]) {
  const open = rows.filter((r) => r.period.status === "OPEN");
  const closed = rows.filter((r) => r.period.status === "CLOSED");
  return { open, closed };
}

export function householdTimelineStats(rows: HouseholdPeriodBundle[]) {
  const readings = rows.map((r) => r.reading).filter(Boolean) as MeterReading[];
  const invoices = rows.map((r) => r.invoice).filter(Boolean) as (Invoice & {
    payment: Payment | null;
  })[];

  const confirmedUsages = readings
    .filter((r) => r.usageM3 != null)
    .map((r) => r.usageM3 as number);
  const avgUsage =
    confirmedUsages.length >= 3
      ? confirmedUsages.slice(0, 3).reduce((a, b) => a + b, 0) / 3
      : confirmedUsages.length
        ? confirmedUsages.reduce((a, b) => a + b, 0) / confirmedUsages.length
        : null;

  const unpaid = invoices.filter((i) => i.status === "ISSUED");
  const unpaidTotal = unpaid.reduce((s, i) => s + i.totalAmount, 0);

  const latestReading = readings.sort((a, b) => {
    const pa = rows.find((x) => x.reading?.id === a.id)?.period;
    const pb = rows.find((x) => x.reading?.id === b.id)?.period;
    if (!pa || !pb) return 0;
    return pb.year - pa.year || pb.month - pa.month;
  })[0];

  return {
    periodCount: rows.filter((r) => r.reading).length,
    pendingReadings: readings.filter((r) => r.status === "PENDING").length,
    unpaidCount: unpaid.length,
    unpaidTotal,
    avgUsage3: avgUsage,
    latestConfirmed: latestReading?.confirmedValue ?? null,
  };
}
