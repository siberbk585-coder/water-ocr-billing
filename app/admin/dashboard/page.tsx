import { prisma } from "@/lib/db";
import { ReadingStatus, InvoiceStatus } from "@prisma/client";
import Link from "next/link";
import { auditActionLabel, entityLabel } from "@/lib/vi";

export default async function AdminDashboardPage() {
  const [households, pendingReadings, issuedInvoices, paidInvoices, recentAudit] =
    await Promise.all([
      prisma.household.count(),
      prisma.meterReading.count({ where: { status: ReadingStatus.PENDING } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.ISSUED } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: true } }),
    ]);

  const ocrStats = await prisma.meterReading.findMany({
    where: { ocrValue: { not: null }, confirmedValue: { not: null } },
    select: { ocrValue: true, confirmedValue: true, confidence: true },
    take: 500,
  });
  const ocrMatch = ocrStats.filter((r) => r.ocrValue === r.confirmedValue).length;
  const ocrAccuracy = ocrStats.length ? Math.round((ocrMatch / ocrStats.length) * 100) : 0;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Tổng quan</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Hộ dân" value={households} tone="blue" />
        <Kpi title="Chỉ số chờ duyệt" value={pendingReadings} href="/admin/readings" tone="yellow" />
        <Kpi title="Hóa đơn chưa TT" value={issuedInvoices} href="/admin/invoices" tone="pink" />
        <Kpi title="Đã thanh toán" value={paidInvoices} href="/admin/payments" tone="mint" />
      </div>
      <div className="card mb-6">
        <h2 className="mb-2 font-semibold">Độ chính xác OCR (mẫu gần đây)</h2>
        <p className="text-3xl font-bold text-[var(--primary)]">{ocrAccuracy}%</p>
        <p className="text-sm text-slate-600">So sánh chỉ số OCR với chỉ số người dùng xác nhận</p>
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
