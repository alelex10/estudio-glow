import "dotenv/config";
import { db } from "../src/db";
import { seedUsers } from "../src/seeds/data/user";

async function seed() {
  console.log("🌱 Iniciando seed de usuarios...");

  try {
    const results = await seedUsers(db);

    console.log("✅ Usuarios creados exitosamente:");
    results.forEach((user: any) => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log("🎉 Seed completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  }
}

seed();
