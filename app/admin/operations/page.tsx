import Link from "next/link";

const monthlySteps = [
  {
    title: "1. Ghi chỉ số",
    body: "Hộ dân vào Ghi chỉ số, nhập CSM, gửi ảnh nếu có. Admin xem tab Chờ chốt để kiểm tra ảnh và duyệt.",
    href: "/admin/billing-sheet?route=all&status=pending",
    cta: "Mở chờ chốt",
  },
  {
    title: "2. Hóa đơn",
    body: "Sau khi chốt CSM: chốt hóa đơn kỳ (tính tổng tiền), xuất PDF từng hộ trên bảng thu.",
    href: "/admin/invoices",
    cta: "Mở hóa đơn",
  },
  {
    title: "3. Thu tiền",
    body: "Theo dõi chuyển khoản hoặc tiền mặt, sau đó đánh dấu Đã thu ở bảng thu nước hoặc trang Thanh toán.",
    href: "/admin/payments",
    cta: "Mở thu tiền",
  },
  {
    title: "4. Khóa sổ",
    body: "Tải Excel kỳ này cho kế toán, kiểm tra công nợ còn lại rồi đóng kỳ khi hoàn tất.",
    href: "/admin/export",
    cta: "Tải Excel",
  },
];

export default function AdminOperationsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quy trình vận hành</h1>
        <p className="text-sm text-[var(--muted)]">
          Cấu trúc ứng dụng theo một luồng thu tiền nước hàng tháng: ghi số, chốt,
          lập hóa đơn, thu tiền và khóa sổ.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {monthlySteps.map((step) => (
          <div key={step.title} className="card">
            <h2 className="mb-2 text-lg font-bold">{step.title}</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">{step.body}</p>
            <Link href={step.href} className="btn btn-secondary">
              {step.cta}
            </Link>
          </div>
        ))}
      </section>

      <section className="card mt-6">
        <h2 className="mb-3 text-lg font-bold">Vai trò trong hệ thống</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <RoleCard title="Hộ dân" body="Gửi CSM và xem hóa đơn của mình trên app." />
          <RoleCard
            title="Tổ trưởng / Kế toán"
            body="Chốt chỉ số, chốt hóa đơn, xuất PDF, xác nhận đã thu."
          />
          <RoleCard
            title="n8n / VPS"
            body="Lưu ảnh đồng hồ lên Drive (tùy cấu hình webhook)."
          />
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="mb-3 text-lg font-bold">Trạng thái chỉ số</h2>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Ý nghĩa</th>
                <th>Thao tác tiếp theo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td>
                  <span className="badge badge-warning">Chờ chốt</span>
                </td>
                <td>Hộ đã gửi, tổ trưởng/kế toán chưa duyệt.</td>
                <td>Chốt hoặc từ chối trên Bảng thu nước.</td>
              </tr>
              <tr className="border-b">
                <td>
                  <span className="badge badge-success">Đã xác nhận</span>
                </td>
                <td>Đã chốt và được dùng để tính cước.</td>
                <td>Chốt hóa đơn, xuất PDF, thu tiền.</td>
              </tr>
              <tr>
                <td>
                  <span className="badge badge-danger">Từ chối</span>
                </td>
                <td>Chỉ số sai hoặc ảnh không đạt yêu cầu.</td>
                <td>Hộ dân gửi lại trong kỳ còn mở.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card-muted)] p-3">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}
