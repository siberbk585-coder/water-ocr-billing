"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

export async function createRoute(formData: FormData): Promise<void> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  if (!code || !name) return;

  const defaultGroup = await prisma.priceGroup.findFirst({ orderBy: { code: "asc" } });
  await prisma.collectionRoute.create({
    data: {
      code,
      name,
      sortOrder,
      unitPrice: defaultGroup?.unitPrice ?? 15000,
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/admin/billing-sheet");
  revalidatePath("/admin/area-prices");
}

export async function updateRoute(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  if (!id || !name) return;

  await prisma.collectionRoute.update({
    where: { id },
    data: { name, sortOrder },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/admin/billing-sheet");
}

export async function assignHouseholdToRoute(formData: FormData): Promise<void> {
  await requireAdmin();
  const householdId = String(formData.get("householdId") ?? "");
  const collectionRouteId = String(formData.get("collectionRouteId") ?? "").trim();
  const routeSortOrder = parseInt(String(formData.get("routeSortOrder") ?? ""), 10);
  if (!householdId) return;

  await prisma.household.update({
    where: { id: householdId },
    data: {
      collectionRouteId: collectionRouteId || null,
      routeSortOrder: collectionRouteId && !Number.isNaN(routeSortOrder) ? routeSortOrder : null,
    },
  });
  revalidatePath("/admin/routes");
  revalidatePath("/admin/billing-sheet");
  revalidatePath("/admin/households");
}
