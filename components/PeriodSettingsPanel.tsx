"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PeriodSettingsPanel({
  periodCloseDay,
  periodId,
  periodOpen,
  onSuccess,
}: {
  periodCloseDay: number;
  periodId?: string;
  periodOpen?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [day, setDay] = useState(String(periodCloseDay));
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveDay() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodCloseDay: parseInt(day, 10) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg(body.error ?? "Lỗi");
        return;
      }
      setMsg("Đã lưu ngày đóng kỳ.");
      router.refresh();
      onSuccess?.();
    } catch {
      setMsg("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  async function closePeriod() {
    if (!periodId || !confirm("Đóng kỳ này? Hộ sẽ không gửi chỉ số thêm.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/periods/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg(body.error ?? "Lỗi");
        return;
      }
      setMsg("Đã đóng kỳ.");
      router.refresh();
      onSuccess?.();
    } catch {
      setMsg("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Hộ dân không gửi chỉ số sau <strong>ngày {periodCloseDay}</strong> hàng tháng (khi kỳ đang
        mở).
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="label mb-0" htmlFor="close-day">
            Ngày đóng kỳ (1–28)
          </label>
          <input
            id="close-day"
            className="input w-24"
            type="number"
            min={1}
            max={28}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => void saveDay()}
        >
          Lưu
        </button>
        {periodId && periodOpen && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => void closePeriod()}
          >
            Đóng kỳ
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>}
    </div>
  );
}
