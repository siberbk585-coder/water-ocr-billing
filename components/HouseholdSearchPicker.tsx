"use client";

import { useMemo, useRef, useState } from "react";

export type HouseholdSearchOption = {
  id: string;
  householdCode: string;
  residentName: string;
  routeLabel: string | null;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function HouseholdSearchPicker({
  households,
  name = "householdId",
  required = true,
  placeholder = "Tìm MKH, tên hộ…",
}: {
  households: HouseholdSearchOption[];
  name?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = households.find((h) => h.id === selectedId);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? households.filter((h) => {
          const hay = normalize(
            `${h.householdCode} ${h.residentName} ${h.routeLabel ?? ""}`
          );
          return hay.includes(q);
        })
      : [...households];
    list.sort((a, b) => {
      const aUn = a.routeLabel?.startsWith("Chưa") ? 0 : 1;
      const bUn = b.routeLabel?.startsWith("Chưa") ? 0 : 1;
      if (aUn !== bUn) return aUn - bUn;
      return a.householdCode.localeCompare(b.householdCode);
    });
    return list.slice(0, q ? 30 : 40);
  }, [households, query]);

  function pick(h: HouseholdSearchOption) {
    setSelectedId(h.id);
    setQuery(`${h.householdCode} — ${h.residentName}`);
    setOpen(false);
  }

  function clear() {
    setSelectedId("");
    setQuery("");
  }

  return (
    <div className="relative min-w-[200px] flex-[2]">
      <input type="hidden" name={name} value={selectedId} required={required} />
      <input
        type="search"
        className="input w-full"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {selected && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          aria-label="Xóa lựa chọn"
        >
          ✕
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {filtered.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                role="option"
                aria-selected={selectedId === h.id}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--primary-soft)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(h)}
              >
                <span className="font-mono font-semibold">{h.householdCode}</span>
                <span className="mx-1 text-[var(--muted)]">—</span>
                <span>{h.residentName}</span>
                {h.routeLabel && (
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {h.routeLabel}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <p className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted)] shadow">
          Không tìm thấy hộ phù hợp
        </p>
      )}
    </div>
  );
}
