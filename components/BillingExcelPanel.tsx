import { BillingExcelUpload } from "./BillingExcelUpload";

type Props = {
  periodId: string;
};

/** Tải / upload Excel — khối riêng góc phải trên bảng thu nước. */
export function BillingExcelPanel({ periodId }: Props) {
  return (
    <aside
      className="flex w-full shrink-0 flex-col gap-1.5 self-start rounded-lg border border-[var(--border)] bg-slate-50/90 p-2 sm:w-48 lg:-mt-1"
      aria-label="Excel kỳ này"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Excel
      </span>
      <a
        href={`/api/exports/period-xlsx?periodId=${periodId}`}
        className="btn btn-secondary w-full py-1.5 text-xs"
      >
        Tải tháng này
      </a>
      <BillingExcelUpload periodId={periodId} />
    </aside>
  );
}
