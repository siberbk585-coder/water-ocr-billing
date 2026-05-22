"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExportInvoiceButton({
  invoiceId,
  meterCode,
  hasPdf,
}: {
  invoiceId: string;
  meterCode: string;
  hasPdf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exportPdf() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/export-local`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? `Lỗi HTTP ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      router.refresh();
    } catch {
      alert("Không tải được PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="text-sm font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
        onClick={exportPdf}
        disabled={loading}
        title="Tạo PDF lưu máy chủ (không qua n8n)"
      >
        {loading ? "Đang tạo…" : hasPdf ? "Tạo lại PDF" : "Xuất PDF"}
      </button>
      {hasPdf && (
        <a
          href={`/invoice/${invoiceId}`}
          className="text-xs text-[var(--muted)] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem
        </a>
      )}
      <span className="sr-only">{meterCode}</span>
    </div>
  );
}
