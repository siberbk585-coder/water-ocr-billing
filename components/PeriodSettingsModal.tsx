"use client";

import { useEffect, useRef, useState } from "react";
import { PeriodSettingsPanel } from "@/components/PeriodSettingsPanel";

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PeriodSettingsModal({
  periodCloseDay,
  periodId,
  periodOpen,
}: {
  periodCloseDay: number;
  periodId?: string;
  periodOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary grid h-9 w-9 place-items-center p-0"
        aria-label="Cài đặt kỳ thu nước"
        title="Cài đặt kỳ"
        onClick={() => setOpen(true)}
      >
        <GearIcon />
      </button>

      <dialog
        ref={dialogRef}
        className="w-[min(100vw-2rem,28rem)] max-w-lg rounded-xl border border-[var(--border)] bg-white p-0 shadow-lg backdrop:bg-black/40"
        onClose={() => setOpen(false)}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="font-semibold">Cài đặt kỳ</h2>
          <button
            type="button"
            className="btn btn-secondary px-2 py-1 text-sm"
            onClick={() => setOpen(false)}
          >
            Đóng
          </button>
        </div>
        <div className="p-4">
          <PeriodSettingsPanel
            periodCloseDay={periodCloseDay}
            periodId={periodId}
            periodOpen={periodOpen}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </dialog>
    </>
  );
}
