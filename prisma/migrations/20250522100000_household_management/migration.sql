-- Quản lý theo hộ dân: mã hộ, trạng thái, liên hệ

CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Household" ADD COLUMN "householdCode" TEXT;
ALTER TABLE "Household" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "Household" ADD COLUMN "status" "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Household" ADD COLUMN "note" TEXT;

UPDATE "Household"
SET "householdCode" = 'HH' || SUBSTRING("meterCode" FROM 3)
WHERE "householdCode" IS NULL;

ALTER TABLE "Household" ALTER COLUMN "householdCode" SET NOT NULL;

CREATE UNIQUE INDEX "Household_householdCode_key" ON "Household"("householdCode");
