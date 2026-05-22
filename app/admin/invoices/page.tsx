import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";
import { GenerateInvoicesButton } from "./GenerateInvoicesButton";
import { SendZaloButton } from "./SendZaloButton";
import { ExportInvoiceButton } from "./ExportInvoiceButton";
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
        {currentPeriod && (
          <div className="flex flex-wrap gap-2">
            <GenerateInvoicesButton periodId={currentPeriod.id} />
            <SendZaloButton periodId={currentPeriod.id} />
          </div>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-600">
        <strong>Xuất PDF</strong> từng dòng: tạo file tại chỗ (thư mục{" "}
        <code className="text-xs">storage/invoices</code>), có QR nếu đã cấu hình bank trong .env.
        Đẩy Drive qua n8n tính sau.{" "}
        <Link
          href="/admin/billing-sheet?route=all"
          className="text-[var(--primary)] hover:underline"
        >
          Bảng thu nước
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
              <th>Zalo</th>
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
                <td className="text-xs">
                  {inv.zaloSentAt
                    ? inv.zaloSentAt.toLocaleString("vi-VN", { dateStyle: "short" })
                    : "—"}
                </td>
                <td>
                  <ExportInvoiceButton
                    invoiceId={inv.id}
                    meterCode={inv.household.meterCode}
                    hasPdf={Boolean(inv.pdfPath)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
