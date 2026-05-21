import { requireResident } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getOldReading, readingLastUpdatedAt } from "@/lib/readings";
import { SubmitReadingClient } from "./SubmitReadingClient";
import { formatPeriod } from "@/lib/vi";

export default async function SubmitReadingPage() {
  const user = await requireResident();
  if (!user.householdId) {
    return <p>Tài khoản chưa gắn hộ dân. Vui lòng liên hệ quản trị.</p>;
  }

  const household = await prisma.household.findUniqueOrThrow({
    where: { id: user.householdId },
    include: { priceGroup: true },
  });

  const currentPeriod = await prisma.billingPeriod.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const currentReading =
    currentPeriod && user.householdId
      ? await prisma.meterReading.findUnique({
          where: {
            householdId_periodId: {
              householdId: user.householdId,
              periodId: currentPeriod.id,
            },
          },
        })
      : null;

  const lastUpdatedAt = currentReading ? readingLastUpdatedAt(currentReading) : null;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Ghi chỉ số đồng hồ</h1>
      <div className="card mb-4">
        <p className="text-sm">
          <strong>Đồng hồ:</strong> {household.meterCode} — {household.address}
        </p>
        {currentPeriod && (
          <p className="text-sm text-slate-600">
            Kỳ hiện tại: {formatPeriod(currentPeriod.month, currentPeriod.year)}
          </p>
        )}
        {lastUpdatedAt && (
          <p className="mt-2 text-sm text-slate-600">
            Cập nhật gần nhất:{" "}
            <strong>
              {lastUpdatedAt.toLocaleString("vi-VN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </strong>
            {currentReading?.confirmedValue != null && (
              <>
                {" "}
                — CSM <strong>{currentReading.confirmedValue}</strong>
                {currentReading.usageM3 != null && (
                  <span> ({currentReading.usageM3} m³)</span>
                )}
              </>
            )}
          </p>
        )}
      </div>
      {currentPeriod ? (
        <SubmitReadingClient
          periodId={currentPeriod.id}
          oldReading={await getOldReading(user.householdId, currentPeriod.id)}
          initialCsm={
            currentReading?.confirmedValue != null
              ? String(currentReading.confirmedValue)
              : ""
          }
        />
      ) : (
        <p>Chưa có kỳ tính cước.</p>
      )}
    </>
  );
}
