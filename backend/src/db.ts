import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from "./config/env";
import * as schema from "./models/relations";

// Supabase pooler (PgBouncer transaction mode) does not support prepared statements.
// For direct Postgres connections, prepared statements improve query performance.
// Auto-detect: disable prepare when connecting through the Supabase pooler.
const usePrepare = !env.DATABASE_URL.includes("pooler.supabase.com");

// Pool tuning: bounded connections per-instance, recycle idle to free DB slots,
// and cap individual statement runtime so a slow query cannot park a connection.
const client = postgres(env.DATABASE_URL, {
  prepare: usePrepare,                     // false for Supabase/PgBouncer; true for direct Postgres.
  max: env.PG_POOL_MAX ?? 10,              // Concurrent connections per Node instance.
  idle_timeout: 20,                        // Seconds. Close idle conns and free DB slots.
  max_lifetime: 60 * 30,                   // Seconds. Recycle every 30 min.
  connect_timeout: 10,                     // Seconds. Fail fast on outage.
  connection: {
    statement_timeout: env.PG_STATEMENT_TIMEOUT_MS ?? 15_000, // ms.
  },
});
export const db = drizzle({ client, schema });

export default db;
