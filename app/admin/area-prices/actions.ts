"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

export async function saveRoutePrices(formData: FormData): Promise<void> {
  await requireAdmin();

  const routes = await prisma.collectionRoute.findMany({ select: { id: true } });
  for (const route of routes) {
    const raw = String(formData.get(`price_${route.id}`) ?? "").trim();
    if (!raw) continue;
    const unitPrice = parseInt(raw.replace(/\D/g, ""), 10);
    if (Number.isNaN(unitPrice) || unitPrice < 0) continue;

    await prisma.collectionRoute.update({
      where: { id: route.id },
      data: { unitPrice },
    });
  }

  revalidatePath("/admin/area-prices");
  revalidatePath("/admin/billing-sheet");
  revalidatePath("/admin/routes");
}

export async function createRouteWithPrice(formData: FormData): Promise<void> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  const unitPrice = parseInt(String(formData.get("unitPrice") ?? "15000").replace(/\D/g, ""), 10) || 15000;
  if (!code || !name) return;

  await prisma.collectionRoute.create({
    data: { code, name, sortOrder, unitPrice },
  });
  revalidatePath("/admin/area-prices");
  revalidatePath("/admin/billing-sheet");
}
