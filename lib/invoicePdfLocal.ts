import { InvoiceStatus, ReadingStatus } from "@prisma/client";
import { calculateTotal } from "./billing";
import { unitPriceForHousehold } from "./routePricing";
import { syncInvoiceForConfirmedReading } from "./invoices";
import { prisma } from "./db";
import { generateInvoicePdf } from "./pdf";
import { saveBuffer } from "./storage";
import { formatPeriod } from "./vi";

/** Đảm bảo có hóa đơn đã tính tổng tiền từ chỉ số đã chốt. */
export async function ensureInvoiceForHouseholdPeriod(
  householdId: string,
  periodId: string
): Promise<string> {
  const synced = await syncInvoiceForConfirmedReading(householdId, periodId);
  if (!synced) {
    throw new Error("Hộ chưa chốt số — chốt trên bảng trước");
  }
  return synced.id;
}

/** Tạo / cập nhật 1 hóa đơn PDF — lưu file local, không gọi n8n. */
export async function exportInvoicePdfLocal(invoiceId: string): Promise<{
  buffer: Buffer;
  pdfPath: string;
  meterCode: string;
}> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      household: { include: { priceGroup: true, collectionRoute: true } },
      period: true,
    },
  });
  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }

  const reading = await prisma.meterReading.findUnique({
    where: {
      householdId_periodId: {
        householdId: invoice.householdId,
        periodId: invoice.periodId,
      },
    },
  });

  if (!reading || reading.status !== ReadingStatus.CONFIRMED) {
    throw new Error("Hộ chưa chốt chỉ số (CSM) — chốt trên bảng ghi trước");
  }
  if (reading.confirmedValue == null || reading.usageM3 == null) {
    throw new Error("Thiếu chỉ số đã chốt");
  }

  const unitPrice =
    invoice.unitPrice ?? unitPriceForHousehold(invoice.household);
  const usageM3 = invoice.usageM3 ?? reading.usageM3;
  const totalAmount =
    invoice.totalAmount ?? calculateTotal(usageM3, unitPrice);

  const pdf = await generateInvoicePdf({
    invoiceCode: invoice.id.slice(-8).toUpperCase(),
    householdCode: invoice.household.householdCode,
    meterCode: invoice.household.meterCode,
    residentName: invoice.household.residentName,
    address: invoice.household.address,
    periodLabel: formatPeriod(invoice.period.month, invoice.period.year),
    oldReading: reading.oldReading,
    newReading: reading.confirmedValue,
    usageM3,
    unitPrice,
    totalAmount,
  });

  const pdfPath = await saveBuffer(
    "invoices",
    `${invoice.household.meterCode}_${invoice.period.year}-${invoice.period.month}.pdf`,
    pdf
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      pdfPath,
      usageM3,
      unitPrice,
      totalAmount,
      status: InvoiceStatus.ISSUED,
      issuedAt: invoice.issuedAt ?? new Date(),
    },
  });

  return {
    buffer: pdf,
    pdfPath,
    meterCode: invoice.household.meterCode,
  };
}
