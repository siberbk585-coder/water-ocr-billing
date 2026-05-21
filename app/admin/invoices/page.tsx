import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";
import { GenerateInvoicesButton } from "./GenerateInvoicesButton";
import { formatPeriod, invoiceStatusLabel } from "@/lib/vi";

export default async function AdminInvoicesPage() {
  const periods = await prisma.billingPeriod.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 6,
  });
  const currentPeriod = periods[0];

  const invoices = await prisma.invoice.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { household: true, period: true },
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hóa đơn</h1>
        {currentPeriod && <GenerateInvoicesButton periodId={currentPeriod.id} />}
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Xuất dữ liệu:{" "}
        <Link href="/admin/export" className="text-[var(--primary)] hover:underline">
          Tải Excel tổng hợp hoặc CSV
        </Link>
      </p>
      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Đồng hồ</th>
              <th>Kỳ</th>
              <th>Tiêu thụ</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b">
                <td className="font-mono">{inv.household.meterCode}</td>
                <td>{formatPeriod(inv.period.month, inv.period.year)}</td>
                <td>{inv.usageM3} m³</td>
                <td>{formatCurrency(inv.totalAmount)}</td>
                <td>{invoiceStatusLabel(inv.status)}</td>
                <td>
                  {inv.pdfPath ? (
                    <Link href={`/api/invoices/${inv.id}/pdf`} className="text-[var(--primary)]">
                      PDF
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
