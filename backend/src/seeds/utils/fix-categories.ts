import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const sql = postgres(connectionString, { max: 1 });

async function fixCategoriesTable() {
  console.log("🔧 Aplicando fix a tabla category...");

  try {
    // Agregar default UUID si no existe
    await sql`
      ALTER TABLE category 
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;

    console.log("✅ Tabla category actualizada correctamente");
  } catch (error: any) {
    if (error.message?.includes("already has a default")) {
      console.log("ℹ️ La columna id ya tiene un default");
    } else {
      throw error;
    }
  } finally {
    await sql.end();
  }
}

fixCategoriesTable();
