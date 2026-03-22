import { categories } from "../../models/relations";
import type { NewCategory } from "../../models/relations";

// Datos de categorías para el seed
export const categoriesData: Omit<NewCategory, "id">[] = [
  {
    name: "Skincare",
    description: "Productos para el cuidado de la piel: limpiadores, tónicos, serums, hidratantes y protectores solares",
  },
  {
    name: "Maquillaje",
    description: "Productos de maquillaje profesional: bases, correctores, sombras, labiales y más",
  },
  {
    name: "Cabello",
    description: "Tratamientos y productos para el cuidado del cabello: shampoos, acondicionadores, aceites y mascarillas",
  },
  {
    name: "Uñas",
    description: "Productos para el cuidado y decoración de uñas: esmaltes, tratamientos y accesorios",
  },
  {
    name: "Corporal",
    description: "Productos para el cuidado corporal: exfoliantes, hidratantes, aceites y tratamientos especiales",
  },
  {
    name: "Accesorios",
    description: "Accesorios de belleza: brochas, esponjas, aplicadores y organizadores",
  },
];

// Función para insertar categorías
export async function seedCategories(db: any) {
  console.log("🌱 Insertando categorías...");

  const inserted = await db.insert(categories).values(categoriesData).returning();

  console.log(`✅ ${inserted.length} categorías insertadas`);

  return inserted;
}
