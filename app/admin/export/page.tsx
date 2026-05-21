import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { AppShell } from "@/components/AppShell";
import { adminNav } from "@/lib/vi";

export default async function AdminExportPage() {
  const user = await requireAdmin();

  return (
    <AppShell user={user} nav={[...adminNav]}>
      <h1 className="mb-2 text-2xl font-bold">Xuất dữ liệu</h1>
      <p className="mb-6 text-sm text-slate-600">
        Tải file Excel (.xlsx) gồm nhiều sheet: tổng quan, hộ dân, kỳ ghi, chỉ số, hóa đơn, thanh toán,
        nhật ký.
      </p>

      <div className="card max-w-lg space-y-4">
        <div>
          <h2 className="mb-2 font-semibold">Báo cáo tổng hợp (khuyến nghị)</h2>
          <p className="mb-3 text-sm text-slate-600">
            Một file Excel chứa toàn bộ dữ liệu hiện có trong hệ thống.
          </p>
          <a href="/api/exports/xlsx" className="btn btn-primary inline-block">
            Tải file Excel (.xlsx)
          </a>
        </div>

        <hr className="border-slate-200" />

        <div>
          <h2 className="mb-2 font-semibold">Chỉ số đồng hồ (CSV)</h2>
          <p className="mb-3 text-sm text-slate-600">Chỉ xuất bảng chỉ số, định dạng CSV.</p>
          <Link href="/api/exports/sheets" className="btn btn-secondary inline-block">
            Tải CSV chỉ số
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
