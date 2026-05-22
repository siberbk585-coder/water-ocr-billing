-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "zaloSentAt" TIMESTAMP(3),
ADD COLUMN "zaloMessageId" TEXT;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "periodCloseDay" INTEGER NOT NULL DEFAULT 25,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SystemSettings" ("id", "periodCloseDay", "timezone", "updatedAt")
VALUES ('default', 25, 'Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
