"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Period = { id: string; label: string };

export function BillingPeriodSelect({
  periods,
  activePeriodId,
  routeId,
  isSummary,
}: {
  periods: Period[];
  activePeriodId: string;
  routeId?: string;
  isSummary?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(periodId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", periodId);
    if (isSummary) {
      params.set("view", "summary");
      params.delete("route");
    } else if (routeId) {
      params.set("route", routeId);
      params.delete("view");
    }
    router.push(`/admin/billing-sheet?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Kỳ:</label>
      <select
        className="input py-1.5"
        value={activePeriodId}
        onChange={(e) => onChange(e.target.value)}
      >
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
