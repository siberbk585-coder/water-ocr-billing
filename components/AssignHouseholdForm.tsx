"use client";

import type { HouseholdSearchOption } from "./HouseholdSearchPicker";
import { HouseholdSearchPicker } from "./HouseholdSearchPicker";

type RouteOption = { id: string; name: string };

export function AssignHouseholdForm({
  households,
  routes,
  defaultRouteId,
  assignAction,
}: {
  households: HouseholdSearchOption[];
  routes: RouteOption[];
  defaultRouteId?: string;
  assignAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={assignAction} className="mb-4 flex flex-wrap items-end gap-2">
      <HouseholdSearchPicker households={households} />
      <select
        name="collectionRouteId"
        className="input min-w-[160px]"
        required
        defaultValue={defaultRouteId ?? routes[0]?.id}
      >
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        name="routeSortOrder"
        type="number"
        placeholder="STT"
        className="input w-20"
        min={1}
        required
      />
      <button type="submit" className="btn btn-primary">
        Gán
      </button>
    </form>
  );
}
