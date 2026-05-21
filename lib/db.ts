import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Tránh dùng Prisma singleton cũ sau `prisma generate` (thiếu model mới → lỗi findMany). */
function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const hasCollectionRoute =
    cached != null &&
    typeof (cached as PrismaClient & { collectionRoute?: { findMany?: unknown } })
      .collectionRoute?.findMany === "function";

  if (cached && hasCollectionRoute) return cached;

  if (cached) {
    void cached.$disconnect();
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
