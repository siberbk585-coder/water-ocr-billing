import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** Khớp schema hiện tại — đổi sau `prisma generate` / migration. */
  prismaSchemaKey?: string;
};

function prismaSchemaKey(): string {
  const route = Prisma.dmmf.datamodel.models.find((m) => m.name === "CollectionRoute");
  const fields = route?.fields.map((f) => f.name).join(",") ?? "";
  return `CollectionRoute:${fields}`;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Tránh singleton Prisma cũ sau `prisma generate` (Turbopack HMR giữ process cũ). */
function getPrisma(): PrismaClient {
  const key = prismaSchemaKey();
  const cached = globalForPrisma.prisma;

  if (cached && globalForPrisma.prismaSchemaKey === key) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect();
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaKey = key;
  }
  return client;
}

export const prisma = getPrisma();
