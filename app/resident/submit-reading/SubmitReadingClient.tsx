"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OcrResponse = {
  readingId: string;
  ocrValue: number | null;
  rawText: string;
  confidence: number;
  needsManual: boolean;
  oldReading: number;
};

export function SubmitReadingClient({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [ocr, setOcr] = useState<OcrResponse | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runOcr() {
    if (!file) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("image", file);
    fd.append("periodId", periodId);
    const res = await fetch("/api/readings/ocr", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      setError("OCR thất bại. Vui lòng thử lại.");
      return;
    }
    const data = (await res.json()) as OcrResponse;
    setOcr(data);
    if (data.ocrValue != null && !data.needsManual) {
      setValue(String(data.ocrValue));
    } else {
      setValue("");
    }
  }

  async function confirm(inputMethod: "OCR_CONFIRMED" | "OCR_EDITED" | "MANUAL") {
    if (!ocr) return;
    const confirmedValue = parseFloat(value);
    if (Number.isNaN(confirmedValue)) {
      setError("Nhập chỉ số hợp lệ");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/readings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readingId: ocr.readingId, confirmedValue, inputMethod }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Không lưu được");
      return;
    }
    router.refresh();
    setOcr(null);
    setFile(null);
    setValue("");
    alert("Đã lưu chỉ số thành công!");
  }

  return (
    <div className="card space-y-4">
      <div>
        <label className="label">Ảnh đồng hồ</label>
        <input
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setOcr(null);
          }}
        />
      </div>
      <button type="button" className="btn btn-primary" disabled={!file || loading} onClick={runOcr}>
        {loading ? "Đang quét OCR..." : "Quét OCR"}
      </button>

      {ocr && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
          <p>
            <strong>Chỉ số cũ:</strong> {ocr.oldReading} m³
          </p>
          <p>
            <strong>OCR:</strong> {ocr.ocrValue ?? "—"} (độ tin cậy {ocr.confidence.toFixed(1)}%)
          </p>
          {ocr.needsManual ? (
            <p className="text-[var(--warning)]">Độ tin cậy &lt; 70% — vui lòng nhập tay.</p>
          ) : (
            <p className="text-[var(--accent)]">Có thể xác nhận hoặc chỉnh sửa.</p>
          )}
          <div>
            <label className="label">Chỉ số xác nhận (m³)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {!ocr.needsManual && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={() => confirm("OCR_CONFIRMED")}
              >
                Xác nhận OCR
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading}
              onClick={() =>
                confirm(
                  ocr.needsManual
                    ? "MANUAL"
                    : ocr.ocrValue?.toString() === value
                      ? "OCR_CONFIRMED"
                      : "OCR_EDITED"
                )
              }
            >
              {ocr.needsManual ? "Lưu nhập tay" : "Lưu (đã chỉnh)"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
