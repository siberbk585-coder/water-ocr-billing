"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateInvoicesButton({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!confirm("Tạo hóa đơn PDF cho kỳ hiện tại?")) return;
    setLoading(true);
    const res = await fetch("/api/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodId }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      alert(`Đã tạo ${data.created} hóa đơn`);
      router.refresh();
    } else {
      alert(data.error ?? "Lỗi");
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={generate} disabled={loading}>
      {loading ? "Đang tạo..." : "Tạo hóa đơn kỳ này"}
    </button>
  );
}
