"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImageForUpload } from "@/lib/imageClient";

export function SubmitReadingClient({
  periodId,
  oldReading,
}: {
  periodId: string;
  oldReading: number;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!file) {
      setError("Vui lòng chụp hoặc chọn ảnh đồng hồ.");
      return;
    }
    const confirmedValue = parseFloat(value);
    if (Number.isNaN(confirmedValue) || confirmedValue <= 0) {
      setError("Nhập chỉ số mới hợp lệ (số dương).");
      return;
    }
    if (confirmedValue < oldReading) {
      setError(`Chỉ số mới phải ≥ chỉ số cũ (${oldReading}).`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const uploadFile = await compressImageForUpload(file);
      const fd = new FormData();
      fd.append("image", uploadFile);
      fd.append("periodId", periodId);
      fd.append("confirmedValue", String(confirmedValue));

      const res = await fetch("/api/readings/submit", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Không lưu được");
        return;
      }
      router.refresh();
      setFile(null);
      setValue("");
      alert("Đã gửi chỉ số thành công!");
    } catch {
      setError("Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Chụp ảnh đồng hồ làm bằng chứng, rồi nhập <strong>chỉ số mới</strong> đang hiển thị trên mặt
        đồng hồ.
      </p>
      <p className="rounded-lg bg-[var(--primary-soft)] px-3 py-2 text-sm text-[var(--primary-dark)]">
        Chỉ số kỳ trước: <strong>{oldReading} m³</strong>
      </p>

      <div>
        <label className="label">Ảnh đồng hồ (bắt buộc)</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="input"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError("");
          }}
        />
      </div>

      <div>
        <label className="label">Chỉ số mới trên đồng hồ (m³)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          min={oldReading}
          placeholder={`Ví dụ: ${oldReading + 10}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={!file || !value || loading}
        onClick={submit}
      >
        {loading ? "Đang lưu..." : "Gửi chỉ số"}
      </button>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
