import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from "./config/env";
import * as schema from "./models/relations";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DATABASE_URL, { prepare: false })
export const db = drizzle({ client, schema });

export default db;
