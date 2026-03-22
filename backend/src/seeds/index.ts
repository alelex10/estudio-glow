import { seedDb, closeSeedConnection } from "./utils/db";
import { seedCategories, categoriesData } from "./data/categories";
import { seedProducts } from "./data/products";
import { products, categories as categoriesTable } from "../models/relations";

/**
 * Orquestador principal de seeds
 *
 * Ejecuta los seeds en orden de dependencias:
 * 1. Categorías (no dependen de nada)
 * 2. Productos (dependen de categorías)
 *
 * Para agregar nuevos seeds:
 * 1. Crea un archivo en `data/[entidad].ts`
 * 2. Exporta una función `seed[Entidad](db, ...dependencias)`
 * 3. Agrega la llamada aquí en el orden correcto
 */
async function main() {
  console.log("\n🌱 Iniciando seeds...\n");

  try {
    // Limpiar tablas en orden inverso (para evitar problemas de FK)
    console.log("🧹 Limpiando datos existentes...");
    await seedDb.delete(products);
    await seedDb.delete(categoriesTable);
    console.log("✅ Limpieza completada\n");

    // Seed 1: Categorías
    const categories = await seedCategories(seedDb);

    // Crear mapa de nombre -> id para referencias
    const categoryMap = new Map<string, string>(categories.map((c: { name: string; id: string }) => [c.name, c.id]));

    // Seed 2: Productos (dependen de categorías)
    await seedProducts(seedDb, categoryMap);

    console.log("\n✨ Todos los seeds completados exitosamente!\n");
  } catch (error) {
    console.error("\n❌ Error durante el seed:\n", error);
    process.exit(1);
  } finally {
    await closeSeedConnection();
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.main) {
  main();
}

export { seedCategories, seedProducts };
