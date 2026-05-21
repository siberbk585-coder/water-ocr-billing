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

  // #region agent log
  fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
    body: JSON.stringify({
      sessionId: "eeecce",
      hypothesisId: "H1-H2",
      location: "lib/db.ts:getPrisma",
      message: "getPrisma evaluate",
      data: {
        hasCached: Boolean(cached),
        hasCollectionRoute,
        cachedCtor: cached?.constructor?.name,
        collectionRouteType: cached ? typeof (cached as { collectionRoute?: unknown }).collectionRoute : "no-cache",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (cached && hasCollectionRoute) return cached;

  if (cached) {
    void cached.$disconnect();
  }

  const client = createPrismaClient();
  // #region agent log
  fetch("http://127.0.0.1:7316/ingest/d8ce1aea-1d6b-4416-9c7e-131c01f3079e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "eeecce" },
    body: JSON.stringify({
      sessionId: "eeecce",
      hypothesisId: "H3",
      location: "lib/db.ts:getPrisma:newClient",
      message: "created new PrismaClient",
      data: {
        newHasCollectionRoute:
          typeof (client as { collectionRoute?: { findMany?: unknown } }).collectionRoute
            ?.findMany === "function",
        delegateSample: Object.keys(client).filter((k) => !k.startsWith("$") && !k.startsWith("_")).slice(0, 12),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
