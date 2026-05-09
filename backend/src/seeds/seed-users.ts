import { seedDb, closeSeedConnection } from "./utils/db";
import { seedUsers } from "./data/user";
import { users } from "../models/relations";

async function main() {
  console.log("\n👤 Seed de usuarios...\n");

  try {
    console.log("🧹 Eliminando usuarios existentes...");
    await seedDb.delete(users);
    console.log("✅ Usuarios eliminados\n");

    const inserted = await seedUsers(seedDb);
    console.log(`✅ ${inserted.length} usuarios creados:`);
    for (const user of inserted) {
      console.log(`   - ${user.name} <${user.email}> (${user.role})`);
    }

    console.log("\n✨ Seed de usuarios completado!\n");
  } catch (error) {
    console.error("\n❌ Error durante el seed de usuarios:\n", error);
    process.exit(1);
  } finally {
    await closeSeedConnection();
  }
}

if (import.meta.main) {
  main();
}
