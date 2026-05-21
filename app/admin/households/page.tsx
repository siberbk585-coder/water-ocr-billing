import Link from "next/link";
import { prisma } from "@/lib/db";
import { latestReading, readingCounts } from "@/lib/household";
import { formatPeriod, householdStatusLabel, readingStatusLabel } from "@/lib/vi";

export default async function AdminHouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const where = q?.trim()
    ? {
        OR: [
          { householdCode: { contains: q.trim(), mode: "insensitive" as const } },
          { meterCode: { contains: q.trim(), mode: "insensitive" as const } },
          { residentName: { contains: q.trim(), mode: "insensitive" as const } },
          { address: { contains: q.trim(), mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [households, total] = await Promise.all([
    prisma.household.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { householdCode: "asc" },
      include: {
        priceGroup: true,
        user: { select: { phone: true } },
        readings: {
          include: { period: true },
          orderBy: [{ period: { year: "desc" } }, { period: { month: "desc" } }],
        },
      },
    }),
    prisma.household.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý hộ dân</h1>
          <p className="text-sm text-[var(--muted)]">
            Trung tâm theo hộ — mỗi hộ một mã, một đồng hồ, lịch sử chỉ số trong chi tiết.
          </p>
        </div>
        <form className="flex gap-2" method="get">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Tìm mã hộ, đồng hồ, tên..."
            className="input min-w-[220px]"
          />
          <button type="submit" className="btn btn-secondary">
            Tìm
          </button>
        </form>
      </div>

      <p className="mb-3 text-sm text-slate-600">
        {total} hộ — trang {page}/{totalPages}
      </p>

      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Mã hộ</th>
              <th>Đồng hồ</th>
              <th>Chủ hộ</th>
              <th>Kỳ gần nhất</th>
              <th>Chỉ số</th>
              <th>Trạng thái hộ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {households.map((h) => {
              const latest = latestReading(h.readings);
              const counts = readingCounts(h.readings);
              return (
                <tr key={h.id} className="border-b">
                  <td className="font-mono font-semibold">
                    <Link
                      href={`/admin/households/${h.id}`}
                      className="text-[var(--primary)] hover:underline"
                    >
                      {h.householdCode}
                    </Link>
                  </td>
                  <td className="font-mono text-sm">{h.meterCode}</td>
                  <td>
                    <div className="font-medium">{h.residentName}</div>
                    <div className="text-xs text-[var(--muted)]">{h.address}</div>
                  </td>
                  <td>
                    {latest
                      ? formatPeriod(latest.period.month, latest.period.year)
                      : "—"}
                  </td>
                  <td className="text-sm">
                    {counts.total} kỳ
                    {counts.pending > 0 && (
                      <span className="badge badge-warning ml-1">
                        {counts.pending} chờ
                      </span>
                    )}
                    {latest && (
                      <div className="text-xs text-[var(--muted)]">
                        {readingStatusLabel(latest.status)}
                      </div>
                    )}
                  </td>
                  <td>{householdStatusLabel(h.status)}</td>
                  <td>
                    <Link
                      href={`/admin/households/${h.id}`}
                      className="text-sm font-semibold text-[var(--primary)] hover:underline"
                    >
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/households?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="btn btn-secondary"
            >
              ← Trước
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin/households?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="btn btn-secondary"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
