ALTER TABLE "CollectionRoute" ADD COLUMN "unitPrice" DOUBLE PRECISION;

-- Gán giá mặc định từ nhóm giá sinh hoạt (15000) cho tuyến đã có
UPDATE "CollectionRoute" SET "unitPrice" = 15000 WHERE "unitPrice" IS NULL;
