"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/apiClient";

export function SendZaloButton({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    if (!confirm("Gửi Zalo OA + QR cho các hóa đơn ISSUED chưa gửi trong kỳ này?")) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/invoices/send-zalo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId }),
      });
      const body = await readJsonResponse<{
        sent?: number;
        total?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      }>(res);
      if (!res.ok) {
        setMsg(body.error ?? "Lỗi");
        return;
      }
      setMsg(`Đã gửi ${body.sent}/${body.total} (bỏ qua webhook: ${body.skipped})`);
      const errors = body.errors ?? [];
      if (errors.length) setMsg((m) => `${m} — lỗi: ${errors.join("; ")}`);
      router.refresh();
    } catch {
      setMsg("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={loading}
        onClick={() => void send()}
      >
        {loading ? "Đang gửi Zalo…" : "Gửi Zalo OA + QR"}
      </button>
      {msg && <p className="text-xs text-[var(--muted)]">{msg}</p>}
    </div>
  );
}
