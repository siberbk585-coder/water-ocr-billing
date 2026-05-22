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
        "Chốt hóa đơn kỳ này: tính tổng tiền cho mọi hộ đã chốt chỉ số? (Không tạo PDF — xuất PDF từng hộ trên Bảng thu nước.)"
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
        let msg = `Đã chốt ${data.created} hóa đơn (đã tính tổng tiền).`;
        if (data.failed) msg += ` ${data.failed} lỗi.`;
        if (data.errors?.length) msg += `\n${data.errors.join("\n")}`;
        alert(msg);
        router.refresh();
      } else {
        alert(data.error ?? "Không chốt được hóa đơn");
      }
    } catch {
      alert("Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={generate} disabled={loading}>
      {loading ? "Đang chốt…" : "Chốt hóa đơn kỳ"}
    </button>
  );
}
