export function WorkflowGuide({
  pending,
  needPdf,
  unpaid,
}: {
  pending: number;
  needPdf: number;
  unpaid: number;
}) {
  return (
    <div className="card mb-4 border-[var(--primary)]/20 bg-[var(--primary-soft)]/30 p-4">
      <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        Làm theo thứ tự — mỗi tháng một lần
      </p>
      <ol className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-lg bg-white/80 px-3 py-2 text-sm shadow-sm">
          <span className="font-bold text-[var(--primary)]">1.</span> Nhập{" "}
          <strong>số mới</strong> (CSM) rồi bấm <strong>Chốt</strong> hoặc{" "}
          <strong>Lưu</strong>
          {pending > 0 && (
            <span className="mt-1 block text-xs text-amber-700">
              Còn {pending} hộ chờ chốt
            </span>
          )}
        </li>
        <li className="rounded-lg bg-white/80 px-3 py-2 text-sm shadow-sm">
          <span className="font-bold text-[var(--primary)]">2.</span> Bấm{" "}
          <strong>Hóa đơn</strong> từng hộ (in / gửi cho khách)
          {needPdf > 0 && (
            <span className="mt-1 block text-xs text-amber-700">
              {needPdf} hộ đã chốt, chưa có PDF
            </span>
          )}
        </li>
        <li className="rounded-lg bg-white/80 px-3 py-2 text-sm shadow-sm">
          <span className="font-bold text-[var(--primary)]">3.</span> Khi khách trả
          tiền, bấm <strong>Đã thu</strong> ở cột Thu
          {unpaid > 0 && (
            <span className="mt-1 block text-xs text-amber-700">
              {unpaid} hộ chưa thu
            </span>
          )}
        </li>
      </ol>
    </div>
  );
}
