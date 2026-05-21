-- CreateTable
CREATE TABLE "CollectionRoute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionRoute_code_key" ON "CollectionRoute"("code");

-- AlterTable
ALTER TABLE "Household" ADD COLUMN "collectionRouteId" TEXT,
ADD COLUMN "routeSortOrder" INTEGER;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_collectionRouteId_fkey" FOREIGN KEY ("collectionRouteId") REFERENCES "CollectionRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
