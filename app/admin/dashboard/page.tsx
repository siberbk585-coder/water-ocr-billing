import Link from "next/link";
import { InvoiceStatus, ReadingStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { getCurrentPeriodProgress } from "@/lib/routeProgress";
import { formatPeriod, periodStatusLabel } from "@/lib/vi";

export default async function AdminDashboardPage() {
  const progress = await getCurrentPeriodProgress();

  if (!progress) {
    return (
      <div className="card">
        <h1 className="mb-2 text-2xl font-bold">Tổng quan thu tiền nước</h1>
        <p className="text-sm text-[var(--muted)]">
          Chưa có kỳ thu. Hãy tạo kỳ trong database hoặc chạy seed trước khi vận hành.
        </p>
      </div>
    );
  }

  const periodId = progress.period.id;
  const [
    confirmedReadings,
    rejectedReadings,
    invoiceCount,
    issuedInvoices,
    paidInvoices,
    missingPdf,
    invoiceTotal,
    paidTotal,
  ] = await Promise.all([
    prisma.meterReading.count({
      where: { periodId, status: ReadingStatus.CONFIRMED },
    }),
    prisma.meterReading.count({
      where: { periodId, status: ReadingStatus.REJECTED },
    }),
    prisma.invoice.count({ where: { periodId } }),
    prisma.invoice.count({
      where: { periodId, status: InvoiceStatus.ISSUED },
    }),
    prisma.invoice.count({
      where: { periodId, status: InvoiceStatus.PAID },
    }),
    prisma.invoice.count({
      where: { periodId, pdfPath: null },
    }),
    prisma.invoice.aggregate({
      where: { periodId },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { periodId, status: InvoiceStatus.PAID },
      _sum: { totalAmount: true },
    }),
  ]);

  const missingReadings = Math.max(0, progress.totalActive - progress.withReading);
  const remainingMoney = Math.max(
    0,
    (invoiceTotal._sum.totalAmount ?? 0) - (paidTotal._sum.totalAmount ?? 0)
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan thu tiền nước</h1>
          <p className="text-sm text-[var(--muted)]">
            {formatPeriod(progress.period.month, progress.period.year)} —{" "}
            {periodStatusLabel(progress.period.status)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/billing-sheet?route=all&status=pending" className="btn btn-primary">
            Xử lý chờ chốt
          </Link>
          <Link href="/admin/billing-sheet?route=all" className="btn btn-secondary">
            Mở bảng thu
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Đã có CSM"
          value={`${progress.withReading}/${progress.totalActive}`}
          hint={`${progress.percent}% hộ đang sử dụng`}
          tone="mint"
        />
        <MetricCard
          label="Chờ chốt"
          value={progress.pending}
          hint={missingReadings > 0 ? `${missingReadings} hộ chưa ghi` : "Đã ghi đủ hộ"}
          tone="yellow"
        />
        <MetricCard
          label="Hóa đơn"
          value={invoiceCount}
          hint={`${missingPdf} hóa đơn chưa có PDF`}
          tone="blue"
        />
        <MetricCard
          label="Đã thu"
          value={formatCurrency(paidTotal._sum.totalAmount ?? 0)}
          hint={`Còn ${formatCurrency(remainingMoney)}`}
          tone="pink"
        />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Checklist vận hành tháng</h2>
              <p className="text-sm text-[var(--muted)]">
                Đi theo thứ tự này để tránh tạo hóa đơn khi chưa chốt CSM.
              </p>
            </div>
            <span className="badge bg-[var(--primary-soft)] text-[var(--primary-dark)]">
              {formatPeriod(progress.period.month, progress.period.year)}
            </span>
          </div>

          <div className="grid gap-3">
            <WorkflowStep
              number="1"
              title="Ghi chỉ số"
              body="Hộ dân gửi CSM, nhân viên có thể nhập trực tiếp trên bảng tuyến."
              href="/admin/billing-sheet?route=all"
              cta="Mở bảng ghi"
              status={
                progress.pending > 0
                  ? `${progress.pending} chờ chốt`
                  : missingReadings > 0
                    ? `${missingReadings} chưa ghi`
                    : "Hoàn tất"
              }
            />
            <WorkflowStep
              number="2"
              title="Chốt chỉ số"
              body="Xem ảnh nếu có, chốt hoặc từ chối chỉ số hộ dân đã gửi."
              href="/admin/billing-sheet?route=all&status=pending"
              cta="Xem chờ chốt"
              status={`${confirmedReadings} đã xác nhận, ${rejectedReadings} từ chối`}
            />
            <WorkflowStep
              number="3"
              title="Hóa đơn"
              body="Chốt hóa đơn kỳ (tính tổng tiền), xuất PDF từng hộ trên bảng thu."
              href="/admin/invoices"
              cta="Mở hóa đơn"
              status={`${issuedInvoices} chưa TT · ${missingPdf} chưa có PDF`}
            />
            <WorkflowStep
              number="4"
              title="Thu tiền & khóa sổ"
              body="Đánh dấu đã thu, tải Excel kỳ này rồi đóng kỳ khi hoàn tất."
              href="/admin/payments"
              cta="Xác nhận thu"
              status={`${paidInvoices} hóa đơn đã thu`}
            />
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-bold">Khu vực thu</h2>
          <div className="space-y-3">
            {progress.routeProgress.map((route) => {
              const percent =
                route.total > 0 ? Math.round((route.recorded / route.total) * 100) : 0;
              return (
                <Link
                  key={route.routeId}
                  href={`/admin/billing-sheet?route=${route.routeId}`}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--card-muted)] px-3 py-2 hover:bg-[var(--primary-soft)]/45"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{route.routeName}</span>
                    <span className="text-[var(--muted)]">{percent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {route.recorded}/{route.total} đã ghi, còn {route.missing}
                  </p>
                </Link>
              );
            })}
            {!progress.routeProgress.length && (
              <p className="text-sm text-[var(--muted)]">
                Chưa có tuyến thu. Tạo tuyến và gán hộ tại{" "}
                <Link href="/admin/routes" className="text-[var(--primary)] hover:underline">
                  quản lý tuyến
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickLink
          title="Danh sách hộ"
          body="Tra cứu hộ dân, đồng hồ, tuyến và lịch sử chỉ số."
          href="/admin/households"
        />
        <QuickLink
          title="Tải Excel"
          body="Xuất sổ thu theo kỳ hoặc dữ liệu tổng hợp cho kế toán."
          href="/admin/export"
        />
        <QuickLink
          title="Tài liệu vận hành"
          body="Quy trình tháng: ghi số, hóa đơn, thu tiền, đóng kỳ."
          href="/admin/operations"
        />
      </section>
    </>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "mint" | "yellow" | "blue" | "pink";
}) {
  const tones = {
    mint: "border-emerald-100 bg-emerald-50/60 text-[var(--primary-dark)]",
    yellow: "border-amber-100 bg-amber-50/60 text-amber-700",
    blue: "border-sky-100 bg-sky-50/60 text-sky-700",
    pink: "border-rose-100 bg-rose-50/60 text-rose-700",
  };

  return (
    <div className={`card border ${tones[tone]}`}>
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  body,
  href,
  cta,
  status,
}: {
  number: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  status: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-3 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary-dark)]">
        {number}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="badge bg-slate-100 text-slate-600">{status}</span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
      </div>
      <Link href={href} className="btn btn-secondary py-1.5 text-sm">
        {cta}
      </Link>
    </div>
  );
}

function QuickLink({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="card block hover:border-[var(--primary)]/40">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </Link>
  );
}
