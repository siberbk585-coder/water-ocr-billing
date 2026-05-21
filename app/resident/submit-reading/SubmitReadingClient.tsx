"use client";

import { useRef, useState } from "react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function pickFile(next: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
    setError("");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  }

  function clearImage() {
    pickFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!file) {
      setError("Vui lòng chụp ảnh hoặc chọn tệp ảnh đồng hồ.");
      return;
    }
    const confirmedValue = parseFloat(value);
    if (Number.isNaN(confirmedValue) || confirmedValue <= 0) {
      setError("Nhập CSM hợp lệ (số dương).");
      return;
    }
    if (confirmedValue < oldReading) {
      setError(`CSM phải ≥ CSC (${oldReading}).`);
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
      clearImage();
      setValue("");
      alert("Đã gửi CSM. Nhân viên sẽ duyệt trên bảng thu nước.");
    } catch {
      setError("Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Chụp ảnh đồng hồ, rồi nhập <strong>chỉ số mới (CSM)</strong> trên mặt đồng hồ. Nhân viên sẽ
        duyệt trên bảng thu.
      </p>
      <p className="rounded-lg bg-[var(--primary-soft)] px-3 py-2 text-sm text-[var(--primary-dark)]">
        Chỉ số cũ (CSC) kỳ trước: <strong>{oldReading} m³</strong>
      </p>

      <div>
        <span className="label">Ảnh đồng hồ (bắt buộc)</span>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          aria-hidden
          onChange={onFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-hidden
          onChange={onFileChange}
        />

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1 min-w-[140px]"
            onClick={() => cameraInputRef.current?.click()}
          >
            Chụp ảnh
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-1 min-w-[140px]"
            onClick={() => fileInputRef.current?.click()}
          >
            Chọn tệp
          </button>
        </div>

        {previewUrl && file && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Ảnh đồng hồ đã chọn"
              className="mx-auto max-h-48 w-full rounded-lg object-contain"
            />
            <p className="mt-2 truncate text-center text-xs text-[var(--muted)]">{file.name}</p>
            <button
              type="button"
              className="btn btn-secondary mt-2 w-full py-1.5 text-sm"
              onClick={clearImage}
            >
              Chọn ảnh khác
            </button>
          </div>
        )}

        {!file && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Trên điện thoại: <strong>Chụp ảnh</strong> mở camera sau; <strong>Chọn tệp</strong> mở
            thư viện ảnh.
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="csm-input">
          Chỉ số mới — CSM (m³)
        </label>
        <input
          id="csm-input"
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
