import Link from "next/link";
import { Suspense } from "react";
import {
  getBillingPeriods,
  getCollectionRoutes,
  loadBillingSheetRows,
  loadRouteSummaries,
} from "@/lib/billingSheet";
import { BillingSheetGrid, type ReadingStatusFilter } from "@/components/BillingSheetGrid";
import { BillingSheetSummary } from "@/components/BillingSheetSummary";
import { BillingPeriodSelect } from "@/components/BillingPeriodSelect";
import { BillingRouteSelect } from "@/components/BillingRouteSelect";
import { BillingExcelPanel } from "@/components/BillingExcelPanel";
import { formatPeriod } from "@/lib/vi";
import { ReadingStatus } from "@prisma/client";

export default async function BillingSheetPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    route?: string;
    view?: string;
    status?: string;
    imported?: string;
    paid?: string;
    errors?: string;
    message?: string;
    durationMs?: string;
  }>;
}) {
  const {
    period: periodId,
    route: routeParam,
    view,
    status: statusParam,
    imported,
    paid,
    errors,
    message,
    durationMs,
  } = await searchParams;
  const statusFilter = (["all", "pending", "confirmed", "rejected"] as const).includes(
    statusParam as ReadingStatusFilter
  )
    ? (statusParam as ReadingStatusFilter)
    : "all";
  const [periods, routes] = await Promise.all([getBillingPeriods(), getCollectionRoutes()]);

  const activePeriod =
    periods.find((p) => p.id === periodId) ??
    periods.find((p) => p.status === "OPEN") ??
    periods[0];

  if (!activePeriod) {
    return (
      <>
        <h1 className="text-2xl font-bold">Bảng thu nước</h1>
        <p className="text-[var(--muted)]">Chưa có kỳ thu. Liên hệ quản trị để tạo kỳ.</p>
      </>
    );
  }

  const periodLabel = formatPeriod(activePeriod.month, activePeriod.year);
  const isSummary = view === "summary" || routeParam === "summary";
  const isAll = routeParam === "all" || (!routeParam && !isSummary);
  const activeRoute =
    !isSummary && !isAll && routeParam
      ? routes.find((r) => r.id === routeParam) ?? null
      : null;

  const rows = isSummary
    ? []
    : await loadBillingSheetRows(
        activePeriod.id,
        isAll ? null : activeRoute?.id ?? null
      );
  const summaries = isSummary ? await loadRouteSummaries(activePeriod.id) : [];

  const pendingCount = rows.filter((r) => r.status === ReadingStatus.PENDING).length;
  const statusTabs: { key: ReadingStatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: pendingCount ? `Chờ chốt (${pendingCount})` : "Chờ chốt" },
    { key: "confirmed", label: "Đã chốt" },
    { key: "rejected", label: "Từ chối" },
  ];

  const routeQuery = isAll ? "all" : activeRoute?.id ?? "all";

  return (
    <>
      {(imported || paid || errors) && (
        <div className="card mb-3 border-[var(--primary)]/30 bg-[var(--primary-soft)]/35 py-3 text-sm">
          Đã xử lý Excel: cập nhật CSM <strong>{imported ?? 0}</strong> · Đã thu{" "}
          <strong>{paid ?? 0}</strong> · Lỗi <strong>{errors ?? 0}</strong>
          {durationMs && (
            <span className="text-[var(--muted)]">
              {" "}
              · {(Number(durationMs) / 1000).toFixed(1)}s
            </span>
          )}
          {message && <span className="text-[var(--warning)]"> — {message}</span>}
        </div>
      )}

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Bảng thu nước</h1>
            <p className="text-sm text-[var(--muted)]">
              Kỳ <strong>{periodLabel}</strong>
              {isAll
                ? " — tất cả hộ"
                : isSummary
                  ? " — tổng theo khu vực"
                  : activeRoute
                    ? ` — ${activeRoute.name}`
                    : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Suspense fallback={<span className="text-sm">Đang tải…</span>}>
              <BillingPeriodSelect
                periods={periods.map((p) => ({
                  id: p.id,
                  label: `${formatPeriod(p.month, p.year)}${p.status === "OPEN" ? " (đang thu)" : ""}`,
                }))}
                activePeriodId={activePeriod.id}
                routeId={isSummary ? undefined : routeQuery}
                isSummary={isSummary}
              />
              <BillingRouteSelect
                periodId={activePeriod.id}
                routes={routes.map((r) => ({ id: r.id, name: r.name }))}
                activeRouteId={isAll ? null : activeRoute?.id ?? null}
                isSummary={isSummary}
              />
            </Suspense>
          </div>
        </div>
        <BillingExcelPanel periodId={activePeriod.id} />
      </div>

      {!isSummary && (activeRoute || isAll) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const href = `/admin/billing-sheet?period=${activePeriod.id}&route=${routeQuery}&status=${tab.key}`;
            const active = statusFilter === tab.key;
            return (
              <Link
                key={tab.key}
                href={href}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-[var(--primary-soft)]",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {isSummary ? (
        <BillingSheetSummary summaries={summaries} periodLabel={periodLabel} />
      ) : activeRoute || isAll ? (
        <BillingSheetGrid
          key={`${activePeriod.id}-${routeQuery}-${statusFilter}`}
          periodId={activePeriod.id}
          rows={rows}
          statusFilter={statusFilter}
          showRoute={isAll}
        />
      ) : (
        <p className="text-[var(--muted)]">
          Chưa có khu vực thu.{" "}
          <Link href="/admin/households" className="text-[var(--primary)] hover:underline">
            Gán hộ vào khu vực
          </Link>
        </p>
      )}

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/admin/routes" className="hover:underline">
          Sửa khu vực thu (tuyến)
        </Link>
        {" · "}
        <Link href="/admin/invoices" className="hover:underline">
          Danh sách hóa đơn
        </Link>
      </p>
    </>
  );
}
