import Link from "next/link";
import { Suspense } from "react";
import {
  getBillingPeriods,
  getCollectionRoutes,
  loadBillingSheetRows,
  loadRouteSummaries,
} from "@/lib/billingSheet";
import { BillingSheetGrid } from "@/components/BillingSheetGrid";
import { BillingSheetSummary } from "@/components/BillingSheetSummary";
import { BillingPeriodSelect } from "@/components/BillingPeriodSelect";
import { formatPeriod } from "@/lib/vi";

export default async function BillingSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; route?: string; view?: string }>;
}) {
  const { period: periodId, route: routeParam, view } = await searchParams;
  // #region agent log
  fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
    body: JSON.stringify({
      sessionId: "eeecce",
      hypothesisId: "H5",
      location: "app/admin/billing-sheet/page.tsx:entry",
      message: "BillingSheetPage load start",
      data: { periodId, routeParam, view },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  let periods: Awaited<ReturnType<typeof getBillingPeriods>>;
  let routes: Awaited<ReturnType<typeof getCollectionRoutes>>;
  try {
    [periods, routes] = await Promise.all([getBillingPeriods(), getCollectionRoutes()]);
    // #region agent log
    fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
      body: JSON.stringify({
        sessionId: "eeecce",
        hypothesisId: "H5",
        location: "app/admin/billing-sheet/page.tsx:success",
        message: "data loaded",
        data: { periodsCount: periods.length, routesCount: routes.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
      body: JSON.stringify({
        sessionId: "eeecce",
        hypothesisId: "H1-H5",
        location: "app/admin/billing-sheet/page.tsx:error",
        message: "load failed",
        data: {
          errorName: err instanceof Error ? err.name : "unknown",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw err;
  }

  const activePeriod =
    periods.find((p) => p.id === periodId) ??
    periods.find((p) => p.status === "OPEN") ??
    periods[0];

  if (!activePeriod) {
    return (
      <>
        <h1 className="text-2xl font-bold">Bảng ghi chỉ số</h1>
        <p className="text-[var(--muted)]">Chưa có kỳ ghi nước. Tạo kỳ trong hệ thống trước.</p>
      </>
    );
  }

  const periodLabel = formatPeriod(activePeriod.month, activePeriod.year);
  const isSummary = view === "summary" || routeParam === "summary";
  const activeRoute = isSummary
    ? null
    : routes.find((r) => r.id === routeParam) ?? routes[0] ?? null;

  const rows =
    !isSummary && activeRoute
      ? await loadBillingSheetRows(activePeriod.id, activeRoute.id)
      : [];
  const summaries = isSummary ? await loadRouteSummaries(activePeriod.id) : [];

  const recorded = rows.filter((r) => r.csm != null).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isSummary ? `TỔNG HỢP (${periodLabel})` : `${activeRoute?.name ?? "Tuyến"} (${periodLabel})`}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Bảng ghi chỉ số theo tuyến — cột CSC, CSM, STT, TT như Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={<span className="text-sm">Đang tải…</span>}>
            <BillingPeriodSelect
              periods={periods.map((p) => ({
                id: p.id,
                label: `${formatPeriod(p.month, p.year)}${p.status === "OPEN" ? " (đang mở)" : ""}`,
              }))}
              activePeriodId={activePeriod.id}
              routeId={activeRoute?.id}
              isSummary={isSummary}
            />
          </Suspense>
          <a
            href={`/api/exports/period-xlsx?periodId=${activePeriod.id}`}
            className="btn btn-primary py-1.5 text-sm"
          >
            Tải Excel kỳ này
          </a>
        </div>
      </div>

      <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
        {routes.map((r) => {
          const href = `/admin/billing-sheet?period=${activePeriod.id}&route=${r.id}`;
          const active = !isSummary && activeRoute?.id === r.id;
          return (
            <Link
              key={r.id}
              href={href}
              className={[
                "rounded-t-lg px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--primary)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-[var(--primary-soft)]",
              ].join(" ")}
            >
              {r.name}
            </Link>
          );
        })}
        <Link
          href={`/admin/billing-sheet?period=${activePeriod.id}&view=summary`}
          className={[
            "rounded-t-lg px-3 py-2 text-sm font-semibold transition-colors",
            isSummary
              ? "bg-[var(--primary)] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-[var(--primary-soft)]",
          ].join(" ")}
        >
          TỔNG HỢP
        </Link>
      </nav>

      {!isSummary && activeRoute && (
        <p className="mb-3 text-sm text-slate-600">
          {rows.length} hộ — đã ghi {recorded}/{rows.length} — Enter trong ô CSM để lưu và nhảy dòng
          kế.
        </p>
      )}

      {isSummary ? (
        <BillingSheetSummary summaries={summaries} periodLabel={periodLabel} />
      ) : activeRoute ? (
        <BillingSheetGrid key={`${activePeriod.id}-${activeRoute.id}`} periodId={activePeriod.id} rows={rows} />
      ) : (
        <p className="text-[var(--muted)]">
          Chưa có tuyến thu.{" "}
          <Link href="/admin/routes" className="text-[var(--primary)] hover:underline">
            Thêm tuyến
          </Link>
        </p>
      )}
    </>
  );
}
