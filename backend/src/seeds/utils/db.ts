import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

// Cliente para seeds (más permisivo con timeouts)
export const seedClient = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Instancia de Drizzle para seeds
export const seedDb = drizzle(seedClient);

// Helper para cerrar la conexión
export async function closeSeedConnection() {
  await seedClient.end();
}
