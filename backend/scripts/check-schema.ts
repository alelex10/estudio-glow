import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "estudio_glow",
  });

  console.log("📊 Verificando esquema de la base de datos...\n");

  try {
    // Verificar tabla category
    const [categorySchema] = await connection.execute(
      "SHOW CREATE TABLE category"
    );
    console.log("=== TABLA CATEGORY ===");
    console.log((categorySchema as any)[0]["Create Table"]);
    console.log("\n");

    // Verificar tabla product
    const [productSchema] = await connection.execute(
      "SHOW CREATE TABLE product"
    );
    console.log("=== TABLA PRODUCT ===");
    console.log((productSchema as any)[0]["Create Table"]);
    console.log("\n");

    // Verificar los tipos de columnas específicas
    const [categoryColumns] = await connection.execute(
      "SHOW COLUMNS FROM category WHERE Field = 'id'"
    );
    console.log("=== COLUMNA category.id ===");
    console.log(categoryColumns);
    console.log("\n");

    const [productColumns] = await connection.execute(
      "SHOW COLUMNS FROM product WHERE Field = 'category_id'"
    );
    console.log("=== COLUMNA product.category_id ===");
    console.log(productColumns);
  } catch (error) {
    console.error("❌ Error al verificar el esquema:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
