import { InvoiceStatus, ReadingStatus } from "@prisma/client";
import { calculateTotal } from "./billing";
import { prisma } from "./db";
import { unitPriceForHousehold } from "./routePricing";

export type SyncedInvoice = {
  id: string;
  usageM3: number;
  unitPrice: number;
  totalAmount: number;
  status: InvoiceStatus;
};

/** Tạo/cập nhật hóa đơn + tổng tiền khi chỉ số đã chốt (CONFIRMED). */
export async function syncInvoiceForConfirmedReading(
  householdId: string,
  periodId: string
): Promise<SyncedInvoice | null> {
  const reading = await prisma.meterReading.findUnique({
    where: { householdId_periodId: { householdId, periodId } },
    include: { household: { include: { priceGroup: true, collectionRoute: true } } },
  });

  if (
    !reading ||
    reading.status !== ReadingStatus.CONFIRMED ||
    reading.confirmedValue == null ||
    reading.usageM3 == null
  ) {
    return null;
  }

  const unitPrice = unitPriceForHousehold(reading.household);
  const totalAmount = calculateTotal(reading.usageM3, unitPrice);

  const invoice = await prisma.invoice.upsert({
    where: { householdId_periodId: { householdId, periodId } },
    create: {
      householdId,
      periodId,
      usageM3: reading.usageM3,
      unitPrice,
      totalAmount,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
    },
    update: {
      usageM3: reading.usageM3,
      unitPrice,
      totalAmount,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
    },
  });

  return {
    id: invoice.id,
    usageM3: invoice.usageM3,
    unitPrice: invoice.unitPrice,
    totalAmount: invoice.totalAmount,
    status: invoice.status,
  };
}
