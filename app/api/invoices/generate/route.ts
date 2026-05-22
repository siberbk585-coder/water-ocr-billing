import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ReadingStatus, InvoiceStatus } from "@prisma/client";
import { calculateTotal } from "@/lib/billing";
import { unitPriceForHousehold } from "@/lib/routePricing";
import { generateInvoicePdf } from "@/lib/pdf";
import { postInvoicePdfToN8nWebhook, n8nInvoiceWebhookUrl } from "@/lib/n8nInvoicePdf";
import { saveBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { formatPeriod } from "@/lib/vi";
import { z } from "zod";

const schema = z.object({ periodId: z.string() });

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
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
      include: {
        household: { include: { priceGroup: true, collectionRoute: true } },
        period: true,
      },
    });

    if (!readings.length) {
      return NextResponse.json({
        error: "Không có chỉ số đã chốt trong kỳ này. Chốt CSM trên bảng ghi trước.",
      });
    }

    let created = 0;
    const errors: string[] = [];

    for (const r of readings) {
      if (r.confirmedValue == null || r.usageM3 == null) continue;
      try {
        const unitPrice = unitPriceForHousehold(r.household);
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
          householdCode: r.household.householdCode,
          meterCode: r.household.meterCode,
          residentName: r.household.residentName,
          address: r.household.address,
          periodLabel: formatPeriod(r.period.month, r.period.year),
          periodMonth: r.period.month,
          periodYear: r.period.year,
          oldReading: r.oldReading,
          newReading: r.confirmedValue,
          usageM3: r.usageM3,
          unitPrice,
          totalAmount,
        });

        const periodLabel = formatPeriod(r.period.month, r.period.year);
        let pdfPath: string;
        if (n8nInvoiceWebhookUrl()) {
          const uploaded = await postInvoicePdfToN8nWebhook(pdf, {
            invoiceId: invoice.id,
            householdId: r.householdId,
            periodId: r.periodId,
            householdCode: r.household.householdCode,
            meterCode: r.household.meterCode,
            periodLabel,
            totalAmount,
          });
          pdfPath = uploaded.url;
        } else {
          pdfPath = await saveBuffer("invoices", `${invoice.id}.pdf`, pdf);
        }
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfPath },
        });
        created++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Lỗi PDF";
        errors.push(`${r.household.householdCode}: ${msg}`);
      }
    }

    try {
      await logAudit({
        actorId: session.id,
        action: "INVOICES_GENERATED",
        entity: "BillingPeriod",
        entityId: parsed.data.periodId,
        metadata: { count: created, failed: errors.length },
      });
    } catch (auditErr) {
      console.error("[invoices/generate] audit log failed", auditErr);
    }

    return NextResponse.json({
      ok: true,
      created,
      failed: errors.length,
      errors: errors.slice(0, 8),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không tạo được hóa đơn";
    console.error("[invoices/generate]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
