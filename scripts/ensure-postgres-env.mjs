/**
 * Local dev: Prisma schema is PostgreSQL. Sync DATABASE_URL from .env.production.local if .env still uses SQLite.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const envPath = path.join(root, ".env");
const prodPath = path.join(root, ".env.production.local");

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function isPostgresUrl(url) {
  return url?.startsWith("postgresql://") || url?.startsWith("postgres://");
}

const env = parseEnv(envPath);
const prod = parseEnv(prodPath);

if (isPostgresUrl(env.DATABASE_URL)) {
  console.log("ensure-postgres-env: .env already uses PostgreSQL");
  process.exit(0);
}

const dbUrl = prod.DATABASE_URL ?? prod.POSTGRES_PRISMA_URL ?? prod.POSTGRES_URL;
const direct =
  prod.DATABASE_URL_UNPOOLED ?? prod.POSTGRES_URL_NON_POOLING ?? dbUrl;

if (!isPostgresUrl(dbUrl)) {
  console.error(
    "ensure-postgres-env: .env uses SQLite/file URL but schema requires PostgreSQL.\n" +
      "  Set DATABASE_URL in .env (copy from Vercel: npx vercel env pull .env.production.local)\n" +
      "  Then: npm run db:migrate:deploy"
  );
  process.exit(1);
}

let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const setOrReplace = (key, value) => {
  const line = `${key}="${value.replace(/"/g, '\\"')}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
};

setOrReplace("DATABASE_URL", dbUrl);
setOrReplace("DATABASE_URL_UNPOOLED", direct);
fs.writeFileSync(envPath, text.endsWith("\n") ? text : `${text}\n`);
console.log("ensure-postgres-env: updated .env DATABASE_URL* from .env.production.local");
