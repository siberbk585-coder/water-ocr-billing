-- Convert TEXT enum columns to native PostgreSQL ENUM types (Neon / Prisma)

CREATE TYPE "UserRole" AS ENUM ('RESIDENT', 'ADMIN');
CREATE TYPE "ReadingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE "InputMethod" AS ENUM ('OCR_CONFIRMED', 'OCR_EDITED', 'MANUAL');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'RESIDENT';

ALTER TABLE "BillingPeriod" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BillingPeriod" ALTER COLUMN "status" TYPE "PeriodStatus" USING ("status"::"PeriodStatus");
ALTER TABLE "BillingPeriod" ALTER COLUMN "status" SET DEFAULT 'OPEN';

ALTER TABLE "MeterReading" ALTER COLUMN "inputMethod" TYPE "InputMethod" USING (
  CASE WHEN "inputMethod" IS NULL THEN NULL ELSE "inputMethod"::"InputMethod" END
);
ALTER TABLE "MeterReading" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MeterReading" ALTER COLUMN "status" TYPE "ReadingStatus" USING ("status"::"ReadingStatus");
ALTER TABLE "MeterReading" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING ("status"::"InvoiceStatus");
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
