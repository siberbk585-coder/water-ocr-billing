import { requireResident } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { getOldReading } from "@/lib/readings";
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
      </div>
      {currentPeriod ? (
        <SubmitReadingClient
          periodId={currentPeriod.id}
          oldReading={await getOldReading(user.householdId, currentPeriod.id)}
        />
      ) : (
        <p>Chưa có kỳ tính cước.</p>
      )}
    </>
  );
}
