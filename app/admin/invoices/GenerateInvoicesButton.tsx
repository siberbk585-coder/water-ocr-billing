"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/apiClient";

export function GenerateInvoicesButton({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (
      !confirm(
        "Tạo hóa đơn PDF (QR) và đẩy lên n8n Hoadon? DB chỉ lưu link — có thể mất vài phút."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId }),
      });
      const data = await readJsonResponse<{
        created?: number;
        failed?: number;
        errors?: string[];
        error?: string;
      }>(res);
      if (res.ok && data.created != null) {
        let msg = `Đã tạo ${data.created} hóa đơn PDF.`;
        if (data.failed) msg += ` ${data.failed} lỗi.`;
        if (data.errors?.length) msg += `\n${data.errors.join("\n")}`;
        alert(msg);
        router.refresh();
      } else {
        alert(data.error ?? "Không tạo được hóa đơn");
      }
    } catch {
      alert("Lỗi kết nối hoặc quá thời gian chờ. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={generate} disabled={loading}>
      {loading ? "Đang tạo..." : "Tạo hóa đơn kỳ này"}
    </button>
  );
}
