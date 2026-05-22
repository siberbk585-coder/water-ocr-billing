import type { RouteSummary } from "@/lib/billingSheet";
import { formatCurrency } from "@/lib/billing";

type Props = {
  summaries: RouteSummary[];
  periodLabel: string;
};

export function BillingSheetSummary({ summaries, periodLabel }: Props) {
  const totals = summaries.reduce(
    (acc, s) => ({
      households: acc.households + s.householdCount,
      recorded: acc.recorded + s.recordedCount,
      pending: acc.pending + s.pendingCount,
      usage: acc.usage + s.totalUsageM3,
      amount: acc.amount + s.totalAmount,
    }),
    { households: 0, recorded: 0, pending: 0, usage: 0, amount: 0 }
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Tổng hợp kỳ <strong>{periodLabel}</strong> — theo từng khu vực thu.
      </p>
      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-100 text-left text-xs uppercase">
            <tr>
              <th>Khu vực</th>
              <th className="text-right">Số hộ</th>
              <th className="text-right">Đã ghi CSM</th>
              <th className="text-right">Chờ duyệt</th>
              <th className="text-right">Tổng STT (m³)</th>
              <th className="text-right">Tổng TT</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.routeId || s.routeCode} className="border-b">
                <td className="font-semibold">{s.routeName}</td>
                <td className="text-right">{s.householdCount}</td>
                <td className="text-right">{s.recordedCount}</td>
                <td className="text-right">
                  {s.pendingCount > 0 ? (
                    <span className="text-[var(--warning)]">{s.pendingCount}</span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="text-right font-mono">{s.totalUsageM3.toFixed(1)}</td>
                <td className="text-right font-mono">{formatCurrency(s.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 bg-slate-50 font-bold">
            <tr>
              <td>TỔNG HỢP</td>
              <td className="text-right">{totals.households}</td>
              <td className="text-right">{totals.recorded}</td>
              <td className="text-right">{totals.pending}</td>
              <td className="text-right font-mono">{totals.usage.toFixed(1)}</td>
              <td className="text-right font-mono">{formatCurrency(totals.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
