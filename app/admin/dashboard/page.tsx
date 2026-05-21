import { prisma } from "@/lib/db";
import { ReadingStatus, InvoiceStatus } from "@prisma/client";
import Link from "next/link";
import { auditActionLabel, entityLabel, formatPeriod } from "@/lib/vi";
import { getCurrentPeriodProgress } from "@/lib/routeProgress";

export default async function AdminDashboardPage() {
  const [households, pendingReadings, issuedInvoices, paidInvoices, recentAudit, progress] =
    await Promise.all([
      prisma.household.count({ where: { status: "ACTIVE" } }),
      prisma.meterReading.count({ where: { status: ReadingStatus.PENDING } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.ISSUED } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: true } }),
      getCurrentPeriodProgress(),
    ]);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Tổng quan</h1>

      {progress && (
        <div className="card mb-6 border-[var(--primary)]/20 bg-[var(--primary-soft)]/30">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                Tiến độ kỳ {formatPeriod(progress.period.month, progress.period.year)}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {progress.withReading}/{progress.totalActive} hộ đã có chỉ số mới (CSM) —{" "}
                {progress.percent}%
              </p>
            </div>
            <Link href="/admin/billing-sheet" className="btn btn-primary">
              Mở bảng ghi chỉ số
            </Link>
          </div>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {progress.pending > 0 && (
            <p className="mb-3 text-sm text-[var(--warning)]">
              {progress.pending} chỉ số chờ duyệt (hộ đã gửi qua app)
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {progress.routeProgress.map((r) => (
              <Link
                key={r.routeId}
                href={`/admin/billing-sheet?period=${progress.period.id}&route=${r.routeId}`}
                className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm hover:border-[var(--primary)]"
              >
                <span className="font-semibold">{r.routeName}</span>
                <span className="block text-xs text-[var(--muted)]">
                  {r.recorded}/{r.total} hộ
                  {r.missing > 0 && (
                    <span className="text-[var(--warning)]"> · thiếu {r.missing}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Hộ đang hoạt động" value={households} href="/admin/households" tone="blue" />
        <Kpi
          title="Chờ duyệt CSM"
          value={pendingReadings}
          href="/admin/billing-sheet"
          tone="yellow"
        />
        <Kpi title="Hóa đơn chưa TT" value={issuedInvoices} href="/admin/invoices" tone="pink" />
        <Kpi title="Đã thanh toán" value={paidInvoices} href="/admin/payments" tone="mint" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Nhật ký gần đây</h2>
        <ul className="space-y-2 text-sm">
          {recentAudit.map((log) => (
            <li key={log.id} className="border-b border-slate-100 pb-2">
              <span className="font-medium">{auditActionLabel(log.action)}</span> —{" "}
              {entityLabel(log.entity)}
              {log.actor && ` (${log.actor.name})`}
              <span className="block text-xs text-slate-500">
                {log.createdAt.toLocaleString("vi-VN")}
              </span>
            </li>
          ))}
          {!recentAudit.length && <li className="text-slate-500">Chưa có nhật ký</li>}
        </ul>
      </div>
    </>
  );
}

function Kpi({
  title,
  value,
  href,
  tone,
}: {
  title: string;
  value: number;
  href?: string;
  tone: "blue" | "yellow" | "pink" | "mint";
}) {
  const tones = {
    blue: "border-sky-100 bg-sky-50/45 text-[var(--accent-blue)]",
    yellow: "border-amber-100 bg-amber-50/55 text-[var(--warning)]",
    pink: "border-rose-100 bg-rose-50/45 text-[var(--danger)]",
    mint: "border-emerald-100 bg-emerald-50/55 text-[var(--primary-dark)]",
  };
  const inner = (
    <div className={`card border ${tones[tone]}`}>
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
