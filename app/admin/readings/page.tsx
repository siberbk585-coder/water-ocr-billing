import Link from "next/link";
import { prisma } from "@/lib/db";
import { latestReading, readingCounts } from "@/lib/household";
import { ReadingStatus } from "@prisma/client";
import { formatPeriod, readingStatusLabel } from "@/lib/vi";

export default async function AdminReadingsPage() {
  const [households, pendingTotal, currentPeriod] = await Promise.all([
    prisma.household.findMany({
      where: { status: "ACTIVE" },
      orderBy: { householdCode: "asc" },
      include: {
        readings: {
          include: { period: true },
          orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
        },
      },
    }),
    prisma.meterReading.count({ where: { status: ReadingStatus.PENDING } }),
    prisma.billingPeriod.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);

  const rows = households.map((h) => {
    const latest = latestReading(h.readings);
    const counts = readingCounts(h.readings);
    const currentReading = currentPeriod
      ? h.readings.find((r) => r.periodId === currentPeriod.id)
      : undefined;
    return { household: h, latest, counts, currentReading };
  });

  const needAttention = rows.filter(
    (r) =>
      r.counts.pending > 0 ||
      (currentPeriod && !r.currentReading) ||
      r.currentReading?.status === ReadingStatus.PENDING
  );

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Chỉ số theo hộ</h1>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Mỗi dòng là một hộ dân — bấm mã hộ để xem lịch sử chỉ số đầy đủ theo từng kỳ.
        {currentPeriod && (
          <>
            {" "}
            Kỳ hiện tại:{" "}
            <strong>{formatPeriod(currentPeriod.month, currentPeriod.year)}</strong>.
          </>
        )}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card border-amber-100 bg-amber-50/50">
          <p className="text-sm text-[var(--muted)]">Chờ duyệt (toàn hệ thống)</p>
          <p className="text-2xl font-bold text-[var(--warning)]">{pendingTotal}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--muted)]">Hộ đang hoạt động</p>
          <p className="text-2xl font-bold">{households.length}</p>
        </div>
        <div className="card border-rose-100 bg-rose-50/40">
          <p className="text-sm text-[var(--muted)]">Cần chú ý kỳ hiện tại</p>
          <p className="text-2xl font-bold text-[var(--danger)]">{needAttention.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Mã hộ</th>
              <th>Chủ hộ</th>
              <th>Kỳ hiện tại</th>
              <th>Chỉ số kỳ này</th>
              <th>Kỳ gần nhất</th>
              <th>Tổng kỳ đã ghi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ household: h, latest, counts, currentReading }) => (
              <tr key={h.id} className="border-b">
                <td className="font-mono font-semibold">
                  <Link
                    href={`/admin/households/${h.id}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {h.householdCode}
                  </Link>
                </td>
                <td>{h.residentName}</td>
                <td>
                  {currentPeriod
                    ? formatPeriod(currentPeriod.month, currentPeriod.year)
                    : "—"}
                </td>
                <td>
                  {!currentReading ? (
                    <span className="badge badge-warning">Chưa gửi</span>
                  ) : (
                    <>
                      {currentReading.oldReading} → {currentReading.confirmedValue ?? "?"}{" "}
                      <span className="text-xs text-[var(--muted)]">
                        ({readingStatusLabel(currentReading.status)})
                      </span>
                    </>
                  )}
                </td>
                <td>
                  {latest ? (
                    <>
                      {formatPeriod(latest.period.month, latest.period.year)} —{" "}
                      {latest.confirmedValue ?? "—"} m³
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {counts.confirmed}/{counts.total}
                  {counts.pending > 0 && (
                    <span className="badge badge-warning ml-1">{counts.pending} chờ</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/households/${h.id}`}
                    className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
