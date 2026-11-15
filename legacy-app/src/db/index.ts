import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: NodePgDatabase;
};

/**
 * الاتصال كسول: لا يُنشأ إلا عند أول استعلام فعلي.
 * يسمح بالبناء والتشغيل بدون DATABASE_URL — تسقط الواجهة
 * تلقائيًا إلى البيانات الاحتياطية في src/lib/fallback-data.ts
 */
function createDb(): NodePgDatabase {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return drizzle(pool);
}

function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsDrizzle) {
    globalForDb.__arenaNextJsDrizzle = createDb();
  }
  return globalForDb.__arenaNextJsDrizzle;
}

/**
 * وكيل يؤجّل إنشاء الاتصال حتى أول استخدام حقيقي،
 * فلا ينكسر البناء عند غياب متغيّر البيئة.
 */
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function getPool(): Pool {
  getDb();
  return globalForDb.__arenaNextJsPostgresqlPool as Pool;
}
