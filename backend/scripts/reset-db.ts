import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function reset() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "estudio_glow",
  });

  console.log("🔄 Reseteando tablas...");

  try {
    // Deshabilitar foreign key checks
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

    // Eliminar tablas
    await connection.execute("DROP TABLE IF EXISTS `product`");
    console.log("✓ Tabla 'product' eliminada");

    await connection.execute("DROP TABLE IF EXISTS `category`");
    console.log("✓ Tabla 'category' eliminada");

    await connection.execute("DROP TABLE IF EXISTS `user`");
    console.log("✓ Tabla 'user' eliminada");

    // Habilitar foreign key checks
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ Base de datos reseteada correctamente");
  } catch (error) {
    console.error("❌ Error al resetear la base de datos:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

reset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
