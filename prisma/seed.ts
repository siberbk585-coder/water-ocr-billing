import { PrismaClient, ReadingStatus, UserRole, InputMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PRICE_GROUPS,
  adminDisplayName,
  demoResidentName,
  randomAddress,
  randomResidentName,
} from "../lib/seed-data";

const prisma = new PrismaClient();

const HOUSEHOLD_COUNT = 250;

function periodLabel(year: number, month: number) {
  return `Tháng ${month}/${year}`;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();
  await prisma.billingPeriod.deleteMany();
  await prisma.priceGroup.deleteMany();

  const priceGroups = await Promise.all(
    PRICE_GROUPS.map((g) =>
      prisma.priceGroup.create({
        data: { code: g.code, name: g.name, unitPrice: g.unitPrice },
      })
    )
  );

  const adminHash = await bcrypt.hash("123456", 10);
  const residentHash = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      phone: "0900000001",
      passwordHash: adminHash,
      name: adminDisplayName(),
      role: UserRole.ADMIN,
    },
  });

  const now = new Date();
  const periods: { id: string; year: number; month: number }[] = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const p = await prisma.billingPeriod.create({
      data: { year: d.getFullYear(), month: d.getMonth() + 1 },
    });
    periods.push(p);
  }
  const currentPeriod = await prisma.billingPeriod.create({
    data: { year: now.getFullYear(), month: now.getMonth() + 1 },
  });
  periods.push(currentPeriod);

  const demoResident = await prisma.user.create({
    data: {
      phone: "0912345678",
      passwordHash: residentHash,
      name: demoResidentName(),
      role: UserRole.RESIDENT,
    },
  });

  for (let i = 1; i <= HOUSEHOLD_COUNT; i++) {
    const meterCode = `DH${String(i).padStart(5, "0")}`;
    const baseReading = 100 + (i % 80);
    const pg = priceGroups[i % 2];
    const userId = i === 1 ? demoResident.id : undefined;

    const household = await prisma.household.create({
      data: {
        meterCode,
        address: randomAddress(i),
        residentName: i === 1 ? demoResidentName() : randomResidentName(i),
        priceGroupId: pg.id,
        userId,
      },
    });

    let prevConfirmed = baseReading;
    for (const period of periods.slice(0, 3)) {
      const usage = 8 + (i % 7) + (period.month % 3);
      const confirmed = prevConfirmed + usage;
      await prisma.meterReading.create({
        data: {
          householdId: household.id,
          periodId: period.id,
          oldReading: prevConfirmed,
          ocrValue: confirmed,
          confirmedValue: confirmed,
          confidence: 85 + (i % 10),
          inputMethod: InputMethod.OCR_CONFIRMED,
          usageM3: usage,
          anomalyFlags: "[]",
          status: ReadingStatus.CONFIRMED,
          confirmedAt: new Date(period.year, period.month - 1, 15),
        },
      });
      prevConfirmed = confirmed;
    }
  }

  console.log(`Đã seed ${HOUSEHOLD_COUNT} hộ dân, ${periods.length} kỳ ghi nước`);
  console.log("Tài khoản quản trị: 0900000001 / 123456");
  console.log("Tài khoản hộ dân: 0912345678 / 123456 (đồng hồ DH00001)");
  console.log(`Kỳ hiện tại: ${periodLabel(currentPeriod.year, currentPeriod.month)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
