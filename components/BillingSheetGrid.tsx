"use client";

import { useCallback, useRef, useState } from "react";
import { ReadingStatus } from "@prisma/client";
import type { BillingSheetRow } from "@/lib/billingSheet";
import { previewBillingRow } from "@/lib/billing";
import { readingStatusLabel } from "@/lib/vi";

type Props = {
  periodId: string;
  rows: BillingSheetRow[];
};

export function BillingSheetGrid({ periodId, rows }: Props) {
  const [localRows, setLocalRows] = useState(rows);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const initDraft = useCallback((row: BillingSheetRow) => {
    if (row.csm != null) return String(row.csm);
    return "";
  }, []);

  function getDraft(householdId: string, row: BillingSheetRow) {
    if (drafts[householdId] !== undefined) return drafts[householdId];
    return initDraft(row);
  }

  function setDraft(householdId: string, value: string) {
    setDrafts((d) => ({ ...d, [householdId]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[householdId];
      return next;
    });
  }

  async function saveRow(row: BillingSheetRow) {
    const raw = getDraft(row.householdId, row);
    const confirmedValue = parseFloat(raw);
    if (Number.isNaN(confirmedValue) || confirmedValue <= 0) {
      setErrors((e) => ({ ...e, [row.householdId]: "Nhập CSM hợp lệ" }));
      return;
    }
    if (confirmedValue < row.oldReading) {
      setErrors((e) => ({
        ...e,
        [row.householdId]: `CSM phải ≥ CSC (${row.oldReading})`,
      }));
      return;
    }

    setSaving(row.householdId);
    try {
      const res = await fetch("/api/admin/readings/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: row.householdId,
          periodId,
          confirmedValue,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrors((e) => ({ ...e, [row.householdId]: body.error ?? "Lỗi lưu" }));
        return;
      }
      const preview = previewBillingRow(row.oldReading, confirmedValue, row.unitPrice);
      setLocalRows((prev) =>
        prev.map((r) =>
          r.householdId === row.householdId
            ? {
                ...r,
                readingId: body.reading.id,
                csm: confirmedValue,
                status: ReadingStatus.CONFIRMED,
                usageM3: preview.usageM3,
                totalAmount: preview.totalAmount,
              }
            : r
        )
      );
      setDrafts((d) => {
        const next = { ...d };
        delete next[row.householdId];
        return next;
      });
    } catch {
      setErrors((e) => ({ ...e, [row.householdId]: "Lỗi kết nối" }));
    } finally {
      setSaving(null);
    }
  }

  function focusNext(currentId: string) {
    const idx = localRows.findIndex((r) => r.householdId === currentId);
    const next = localRows[idx + 1];
    if (next) inputRefs.current[next.householdId]?.focus();
  }

  return (
    <div className="overflow-x-auto card p-0">
      <table className="table-modern billing-sheet-table min-w-[900px]">
        <thead className="sticky top-0 z-10 border-b bg-slate-100 text-left text-xs uppercase tracking-wide">
          <tr>
            <th className="w-12">TT</th>
            <th>Họ và tên</th>
            <th className="w-28">SĐT</th>
            <th className="w-24">MKH</th>
            <th className="w-20 text-right">CSC</th>
            <th className="w-28 text-right">CSM</th>
            <th className="w-16 text-right">STT</th>
            <th className="w-28 text-right">TT</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {localRows.map((row, index) => {
            const draft = getDraft(row.householdId, row);
            const draftNum = draft === "" ? null : parseFloat(draft);
            const preview =
              draftNum != null && !Number.isNaN(draftNum)
                ? previewBillingRow(row.oldReading, draftNum, row.unitPrice)
                : row.csm != null
                  ? previewBillingRow(row.oldReading, row.csm, row.unitPrice)
                  : previewBillingRow(row.oldReading, null, row.unitPrice);

            const missing = row.csm == null && draft === "";
            const pending = row.status === ReadingStatus.PENDING;
            const rowClass = [
              "border-b",
              missing ? "bg-amber-50/80" : "",
              pending ? "bg-sky-50/50" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={row.householdId} className={rowClass}>
                <td className="text-center text-[var(--muted)]">
                  {row.routeSortOrder ?? index + 1}
                </td>
                <td className="font-medium">{row.residentName}</td>
                <td className="text-sm text-[var(--muted)]">{row.contactPhone ?? ""}</td>
                <td className="font-mono text-sm font-semibold">{row.householdCode}</td>
                <td className="text-right font-mono tabular-nums">{row.oldReading}</td>
                <td className="text-right">
                  <input
                    ref={(el) => {
                      inputRefs.current[row.householdId] = el;
                    }}
                    type="number"
                    inputMode="decimal"
                    className="input w-full max-w-[7rem] py-1 text-right font-mono tabular-nums"
                    placeholder="—"
                    value={draft}
                    onChange={(e) => setDraft(row.householdId, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveRow(row).then(() => focusNext(row.householdId));
                      }
                    }}
                  />
                  {pending && (
                    <span className="badge badge-warning mt-0.5 block text-[10px]">
                      Chờ duyệt
                    </span>
                  )}
                  {row.hasImage && !pending && row.status === ReadingStatus.CONFIRMED && (
                    <span className="mt-0.5 block text-[10px] text-[var(--muted)]">Có ảnh</span>
                  )}
                </td>
                <td className="text-right font-mono tabular-nums">
                  {preview.usageM3 != null ? preview.usageM3 : "—"}
                </td>
                <td className="text-right font-mono tabular-nums text-sm">
                  {preview.totalLabel}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary py-1 text-xs"
                    disabled={saving === row.householdId}
                    onClick={() => void saveRow(row)}
                  >
                    {saving === row.householdId ? "…" : "Lưu"}
                  </button>
                  {errors[row.householdId] && (
                    <p className="mt-1 text-[10px] text-[var(--danger)]">{errors[row.householdId]}</p>
                  )}
                  {row.status && !errors[row.householdId] && (
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {readingStatusLabel(row.status)}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
