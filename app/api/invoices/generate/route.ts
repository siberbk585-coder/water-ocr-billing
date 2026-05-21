import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ReadingStatus, InvoiceStatus } from "@prisma/client";
import { calculateTotal } from "@/lib/billing";
import { generateInvoicePdf } from "@/lib/pdf";
import { saveBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { formatPeriod } from "@/lib/vi";
import { z } from "zod";

const schema = z.object({ periodId: z.string() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const readings = await prisma.meterReading.findMany({
    where: {
      periodId: parsed.data.periodId,
      status: ReadingStatus.CONFIRMED,
    },
    include: { household: { include: { priceGroup: true } }, period: true },
  });

  let created = 0;
  for (const r of readings) {
    if (r.confirmedValue == null || r.usageM3 == null) continue;
    const unitPrice = r.household.priceGroup.unitPrice;
    const totalAmount = calculateTotal(r.usageM3, unitPrice);

    const invoice = await prisma.invoice.upsert({
      where: {
        householdId_periodId: {
          householdId: r.householdId,
          periodId: r.periodId,
        },
      },
      create: {
        householdId: r.householdId,
        periodId: r.periodId,
        usageM3: r.usageM3,
        unitPrice,
        totalAmount,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
      update: {
        usageM3: r.usageM3,
        unitPrice,
        totalAmount,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
    });

    const pdf = await generateInvoicePdf({
      invoiceCode: invoice.id.slice(-8).toUpperCase(),
      meterCode: r.household.meterCode,
      residentName: r.household.residentName,
      address: r.household.address,
      periodLabel: formatPeriod(r.period.month, r.period.year),
      oldReading: r.oldReading,
      newReading: r.confirmedValue,
      usageM3: r.usageM3,
      unitPrice,
      totalAmount,
    });

    const pdfPath = await saveBuffer("invoices", `${invoice.id}.pdf`, pdf);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfPath },
    });
    created++;
  }

  await logAudit({
    actorId: session.id,
    action: "INVOICES_GENERATED",
    entity: "BillingPeriod",
    entityId: parsed.data.periodId,
    metadata: { count: created },
  });

  return NextResponse.json({ ok: true, created });
}
