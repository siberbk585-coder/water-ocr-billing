import { ReadingStatus } from "@prisma/client";
import { prisma } from "./db";
import { calculateTotal, calculateUsage } from "./billing";
import { getOldReading } from "./readings";

export type BillingSheetRow = {
  householdId: string;
  routeSortOrder: number | null;
  residentName: string;
  contactPhone: string | null;
  householdCode: string;
  unitPrice: number;
  oldReading: number;
  readingId: string | null;
  csm: number | null;
  status: ReadingStatus | null;
  usageM3: number | null;
  totalAmount: number | null;
  hasImage: boolean;
};

export type RouteSummary = {
  routeId: string;
  routeName: string;
  routeCode: string;
  householdCount: number;
  recordedCount: number;
  pendingCount: number;
  totalUsageM3: number;
  totalAmount: number;
};

export async function getBillingPeriods() {
  return prisma.billingPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getCollectionRoutes() {
  return prisma.collectionRoute.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function loadBillingSheetRows(
  periodId: string,
  routeId: string | null
): Promise<BillingSheetRow[]> {
  const households = await prisma.household.findMany({
    where: {
      status: "ACTIVE",
      ...(routeId ? { collectionRouteId: routeId } : {}),
    },
    include: {
      priceGroup: true,
      user: { select: { phone: true } },
      readings: {
        where: { periodId },
        take: 1,
      },
    },
    orderBy: [{ routeSortOrder: "asc" }, { householdCode: "asc" }],
  });

  const rows: BillingSheetRow[] = [];
  for (const h of households) {
    const reading = h.readings[0] ?? null;
    let oldReading = reading?.oldReading;
    if (oldReading == null) {
      oldReading = await getOldReading(h.id, periodId);
    }
    const csm =
      reading?.status === ReadingStatus.CONFIRMED
        ? reading.confirmedValue
        : reading?.confirmedValue ?? reading?.ocrValue ?? null;
    const usageM3 =
      csm != null ? calculateUsage(csm, oldReading) : reading?.usageM3 ?? null;
    const totalAmount =
      usageM3 != null && usageM3 > 0
        ? calculateTotal(usageM3, h.priceGroup.unitPrice)
        : usageM3 === 0
          ? 0
          : null;

    rows.push({
      householdId: h.id,
      routeSortOrder: h.routeSortOrder,
      residentName: h.residentName,
      contactPhone: h.contactPhone ?? h.user?.phone ?? null,
      householdCode: h.householdCode,
      unitPrice: h.priceGroup.unitPrice,
      oldReading,
      readingId: reading?.id ?? null,
      csm,
      status: reading?.status ?? null,
      usageM3,
      totalAmount,
      hasImage: Boolean(reading?.imagePath),
    });
  }
  return rows;
}

export async function loadRouteSummaries(periodId: string): Promise<RouteSummary[]> {
  const routes = await getCollectionRoutes();
  const summaries: RouteSummary[] = [];

  for (const route of routes) {
    const rows = await loadBillingSheetRows(periodId, route.id);
    let totalUsageM3 = 0;
    let totalAmount = 0;
    let recordedCount = 0;
    let pendingCount = 0;

    for (const r of rows) {
      if (r.csm != null) {
        recordedCount++;
        if (r.status === ReadingStatus.PENDING) pendingCount++;
        if (r.usageM3 != null) totalUsageM3 += r.usageM3;
        if (r.totalAmount != null) totalAmount += r.totalAmount;
      }
    }

    summaries.push({
      routeId: route.id,
      routeName: route.name,
      routeCode: route.code,
      householdCount: rows.length,
      recordedCount,
      pendingCount,
      totalUsageM3,
      totalAmount,
    });
  }

  const noRoute = await prisma.household.count({
    where: { status: "ACTIVE", collectionRouteId: null },
  });
  if (noRoute > 0) {
    const rows = await prisma.household.findMany({
      where: { status: "ACTIVE", collectionRouteId: null },
      include: {
        readings: { where: { periodId }, take: 1 },
        priceGroup: true,
      },
    });
    let totalUsageM3 = 0;
    let totalAmount = 0;
    let recordedCount = 0;
    let pendingCount = 0;
    for (const h of rows) {
      const reading = h.readings[0];
      if (reading?.confirmedValue != null || reading?.ocrValue != null) {
        recordedCount++;
        if (reading.status === ReadingStatus.PENDING) pendingCount++;
        const csm = reading.confirmedValue ?? reading.ocrValue ?? 0;
        const usage = calculateUsage(csm, reading.oldReading);
        totalUsageM3 += usage;
        if (usage > 0) totalAmount += calculateTotal(usage, h.priceGroup.unitPrice);
      }
    }
    summaries.push({
      routeId: "",
      routeName: "Chưa gán tuyến",
      routeCode: "none",
      householdCount: noRoute,
      recordedCount,
      pendingCount,
      totalUsageM3,
      totalAmount,
    });
  }

  return summaries;
}

