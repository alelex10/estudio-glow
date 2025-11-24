import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./db";
import mysql from "mysql2/promise";

async function main() {
  console.log("Running migrations...");

  // debemos cerrar la conexion despues de la migracion
  // reutilizar la instancia de db para la migracion tal vez mantenga la pool de conexiones abiertas
  // usaremos la db exportada de db.ts

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
