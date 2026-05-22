"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

function householdsListUrl(params?: { error?: string; created?: string }) {
  const q = new URLSearchParams();
  if (params?.error) q.set("error", params.error);
  if (params?.created) q.set("created", params.created);
  const s = q.toString();
  return `/admin/households${s ? `?${s}` : ""}`;
}

export async function createHousehold(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const householdCode = String(formData.get("householdCode") ?? "")
    .trim()
    .toUpperCase();
  const meterCode = String(formData.get("meterCode") ?? "")
    .trim()
    .toUpperCase();
  const residentName = String(formData.get("residentName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const priceGroupId = String(formData.get("priceGroupId") ?? "").trim();
  const collectionRouteId = String(formData.get("collectionRouteId") ?? "").trim();
  const routeSortOrderRaw = String(formData.get("routeSortOrder") ?? "").trim();
  const appPhone = String(formData.get("appPhone") ?? "").trim();
  const appPassword = String(formData.get("appPassword") ?? "").trim();

  if (!householdCode || !meterCode || !residentName || !address || !priceGroupId) {
    redirect(
      householdsListUrl({
        error: "Điền đủ mã hộ, mã đồng hồ, tên chủ hộ, địa chỉ và nhóm giá.",
      })
    );
  }

  const priceGroup = await prisma.priceGroup.findUnique({
    where: { id: priceGroupId },
  });
  if (!priceGroup) {
    redirect(householdsListUrl({ error: "Nhóm giá không hợp lệ." }));
  }

  if (collectionRouteId) {
    const route = await prisma.collectionRoute.findUnique({
      where: { id: collectionRouteId },
    });
    if (!route) {
      redirect(householdsListUrl({ error: "Khu vực không hợp lệ." }));
    }
  }

  let userId: string | undefined;
  if (appPhone) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: appPhone },
      include: { household: { select: { householdCode: true } } },
    });
    if (existingUser?.household) {
      redirect(
        householdsListUrl({
          error: `SĐT ${appPhone} đã gắn hộ ${existingUser.household.householdCode}.`,
        })
      );
    }
    const passwordHash = await bcrypt.hash(
      appPassword.length >= 6 ? appPassword : "123456",
      10
    );
    if (existingUser) {
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name: residentName, passwordHash, role: UserRole.RESIDENT },
      });
      userId = user.id;
    } else {
      const user = await prisma.user.create({
        data: {
          phone: appPhone,
          passwordHash,
          name: residentName,
          role: UserRole.RESIDENT,
        },
      });
      userId = user.id;
    }
  }

  const routeSortOrder = routeSortOrderRaw
    ? parseInt(routeSortOrderRaw, 10)
    : undefined;

  try {
    const household = await prisma.household.create({
      data: {
        householdCode,
        meterCode,
        residentName,
        address,
        contactPhone: contactPhone || appPhone || null,
        priceGroupId,
        collectionRouteId: collectionRouteId || null,
        routeSortOrder:
          collectionRouteId &&
          routeSortOrder != null &&
          !Number.isNaN(routeSortOrder)
            ? routeSortOrder
            : null,
        userId,
      },
    });

    await logAudit({
      actorId: admin.id,
      action: "HOUSEHOLD_CREATED",
      entity: "Household",
      entityId: household.id,
      metadata: { householdCode, meterCode },
    });

    revalidatePath("/admin/households");
    revalidatePath("/admin/billing-sheet");
    revalidatePath("/admin/routes");

    redirect(`/admin/households/${household.id}`);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      redirect(
        householdsListUrl({
          error: "Mã hộ hoặc mã đồng hồ (hoặc tài khoản) đã tồn tại.",
        })
      );
    }
    throw e;
  }
}
