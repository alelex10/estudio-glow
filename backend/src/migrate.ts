import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./db";
import mysql from "mysql2/promise";

async function main() {
  console.log("Running migrations...");

  // We need to close the connection after migration, so we might need a separate connection or handle it carefully.
  // Since db.ts exports a drizzle instance, we can use it.
  // But for migration, it's often better to have a dedicated connection to close it properly.

  // Re-using the db instance from ./db might keep the pool open.
  // Let's try using the exported db.

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
