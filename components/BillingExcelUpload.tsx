"use client";

import { useState } from "react";

type Props = {
  periodId: string;
};

/** Upload Excel với trạng thái đang xử lý (tránh cảm giác treo). */
export function BillingExcelUpload({ periodId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput?.files?.[0]) {
      setError("Chọn file Excel trước khi upload.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData(form);
      const res = await fetch("/api/imports/period-xlsx", {
        method: "POST",
        body: fd,
        redirect: "follow",
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? `Upload thất bại (${res.status})`);
    } catch {
      setError("Không gửi được file. Kiểm tra mạng hoặc thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-1"
      aria-busy={loading}
    >
      <input type="hidden" name="periodId" value={periodId} />
      <button
        type="submit"
        className="btn btn-primary w-full py-1.5 text-xs"
        disabled={loading}
      >
        {loading ? "Đang nhập Excel…" : "Upload"}
      </button>
      <input
        name="file"
        type="file"
        accept=".xlsx,.xls"
        disabled={loading}
        className="block h-7 w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-[11px] leading-7 text-[var(--muted)] file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-[var(--primary-soft)] file:px-2 file:py-0.5 file:text-[10px] file:font-medium file:text-[var(--primary-dark)] disabled:opacity-50"
        aria-label="Chọn file Excel"
        required
      />
      {loading && (
        <p className="text-[10px] text-[var(--muted)]">
          Đang cập nhật chỉ số và thanh toán — có thể mất vài chục giây.
        </p>
      )}
      {error && (
        <p className="text-[10px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
