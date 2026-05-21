import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";
import { InvoiceStatus } from "@prisma/client";
import { ConfirmPaymentButton } from "./ConfirmPaymentButton";
import { formatPeriod } from "@/lib/vi";

export default async function AdminPaymentsPage() {
  const invoices = await prisma.invoice.findMany({
    where: { status: InvoiceStatus.ISSUED },
    include: { household: true, period: true, payment: true },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Xác nhận thanh toán</h1>
      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Đồng hồ</th>
              <th>Kỳ</th>
              <th>Số tiền</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b">
                <td className="font-mono">{inv.household.meterCode}</td>
                <td>{formatPeriod(inv.period.month, inv.period.year)}</td>
                <td>{formatCurrency(inv.totalAmount)}</td>
                <td>
                  <ConfirmPaymentButton invoiceId={inv.id} />
                </td>
              </tr>
            ))}
            {!invoices.length && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  Không có hóa đơn chờ xác nhận
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
