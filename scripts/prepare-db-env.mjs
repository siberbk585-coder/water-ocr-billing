/**
 * Maps Vercel Neon env names to Prisma vars before migrate/build.
 * Neon integration sets DATABASE_URL + DATABASE_URL_UNPOOLED on Vercel.
 */
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
}
