import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { ConfirmPaymentButton } from "./ConfirmPaymentButton";
import { formatPeriod } from "@/lib/vi";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;
  const query = q?.trim();

  const householdFilter: Prisma.HouseholdWhereInput | undefined = query
    ? {
        OR: [
          { householdCode: { contains: query, mode: "insensitive" } },
          { meterCode: { contains: query, mode: "insensitive" } },
          { residentName: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { contactPhone: { contains: query, mode: "insensitive" } },
        ],
      }
    : undefined;

  const where: Prisma.InvoiceWhereInput = {
    status: InvoiceStatus.ISSUED,
    ...(householdFilter ? { household: householdFilter } : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        household: {
          include: { collectionRoute: { select: { name: true } } },
        },
        period: true,
        payment: true,
      },
      orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }, { issuedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (query) params.set("q", query);
    const s = params.toString();
    return `/admin/payments${s ? `?${s}` : ""}`;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xác nhận thanh toán</h1>
          <p className="text-sm text-[var(--muted)]">
            Hóa đơn chưa thu — tìm theo mã hộ, đồng hồ hoặc tên chủ hộ.
          </p>
        </div>
        <form className="flex gap-2" method="get">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Tìm MKH, đồng hồ, tên hộ..."
            className="input min-w-[220px]"
          />
          <button type="submit" className="btn btn-secondary">
            Tìm
          </button>
          {query && (
            <Link href="/admin/payments" className="btn btn-secondary">
              Xóa lọc
            </Link>
          )}
        </form>
      </div>

      <p className="mb-3 text-sm text-slate-600">
        {total} hóa đơn chờ xác nhận
        {query ? ` (lọc: “${query}”)` : ""} — trang {page}/{totalPages}
      </p>

      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left text-sm">
            <tr>
              <th>Mã hộ</th>
              <th>Đồng hồ</th>
              <th>Chủ hộ</th>
              <th>Khu vực</th>
              <th>Kỳ</th>
              <th className="text-right">Số tiền</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b text-sm">
                <td className="font-mono font-semibold">
                  <Link
                    href={`/admin/households/${inv.householdId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {inv.household.householdCode}
                  </Link>
                </td>
                <td className="font-mono">{inv.household.meterCode}</td>
                <td>
                  <div className="font-medium">{inv.household.residentName}</div>
                  <div className="max-w-[14rem] truncate text-xs text-[var(--muted)]">
                    {inv.household.address}
                  </div>
                  {inv.household.contactPhone && (
                    <div className="text-xs text-[var(--muted)]">
                      {inv.household.contactPhone}
                    </div>
                  )}
                </td>
                <td className="text-xs text-[var(--muted)]">
                  {inv.household.collectionRoute?.name ?? "—"}
                </td>
                <td>{formatPeriod(inv.period.month, inv.period.year)}</td>
                <td className="text-right font-semibold tabular-nums">
                  {formatCurrency(inv.totalAmount)}
                </td>
                <td>
                  <ConfirmPaymentButton invoiceId={inv.id} />
                </td>
              </tr>
            ))}
            {!invoices.length && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  {query
                    ? "Không có hóa đơn chờ thu khớp từ khóa tìm."
                    : "Không có hóa đơn chờ xác nhận."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn btn-secondary">
              ← Trước
            </Link>
          )}
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="btn btn-secondary">
              Sau →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
