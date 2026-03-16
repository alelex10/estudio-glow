import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import dotenv from "dotenv";
import * as schema from "./models/relations";

dotenv.config();

// Disable prefetch as it is not supported for "Transaction" pool mode
const connectionString = process.env.DATABASE_URL!
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const client = postgres(connectionString, { prepare: false })
export const db = drizzle({ client, schema });

export default db;
