import { requireAdmin } from "@/lib/guards";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { parseAnomalyFlags } from "@/lib/anomaly";
import { adminNav, anomalyLabel, formatPeriod, readingStatusLabel } from "@/lib/vi";

export default async function AdminReadingsPage() {
  const user = await requireAdmin();

  const readings = await prisma.meterReading.findMany({
    take: 100,
    orderBy: { submittedAt: "desc" },
    include: { household: true, period: true },
  });

  return (
    <AppShell user={user} nav={[...adminNav]}>
      <h1 className="mb-4 text-2xl font-bold">Chỉ số đồng hồ</h1>
      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Đồng hồ</th>
              <th>Kỳ</th>
              <th>Cũ / Mới</th>
              <th>Tiêu thụ</th>
              <th>Độ tin cậy</th>
              <th>Cảnh báo</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => {
              const flags = parseAnomalyFlags(r.anomalyFlags);
              return (
                <tr key={r.id} className="border-b">
                  <td className="font-mono">{r.household.meterCode}</td>
                  <td>{formatPeriod(r.period.month, r.period.year)}</td>
                  <td>
                    {r.oldReading} → {r.confirmedValue ?? "—"}
                  </td>
                  <td>{r.usageM3 ?? "—"}</td>
                  <td>{r.confidence?.toFixed(0) ?? "—"}%</td>
                  <td>
                    {flags.length ? (
                      <span className="badge badge-warning">
                        {flags.map(anomalyLabel).join(", ")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{readingStatusLabel(r.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
