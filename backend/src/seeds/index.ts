import { seedDb, closeSeedConnection } from "./utils/db";
import { seedCategories, categoriesData } from "./data/categories";
import { seedProducts } from "./data/products";
import { seedUsers } from "./data/user";
import { products, categories as categoriesTable, users as usersTable } from "../models/relations";

async function main() {
  console.log("\n🌱 Iniciando seeds...\n");

  try {
    console.log("🧹 Limpiando datos existentes...");
    await seedDb.delete(products);
    await seedDb.delete(categoriesTable);
    await seedDb.delete(usersTable);
    console.log("✅ Limpieza completada\n");

    await seedUsers(seedDb);

    const categories = await seedCategories(seedDb);

    const categoryMap = new Map<string, string>(categories.map((c: { name: string; id: string }) => [c.name, c.id]));

    await seedProducts(seedDb, categoryMap);

    console.log("\n✨ Todos los seeds completados exitosamente!\n");
  } catch (error) {
    console.error("\n❌ Error durante el seed:\n", error);
    process.exit(1);
  } finally {
    await closeSeedConnection();
  }
}

if (import.meta.main) {
  main();
}

export { seedCategories, seedProducts, seedUsers };
