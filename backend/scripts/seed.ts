import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/models/relations";
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Iniciando seed de usuario...");

  try {
    // Hash de la contraseña
    const passwordHash = await hash("estudioglow@423", 12);

    // Insertar usuario
    const result = await db.insert(users).values({
      id: "admin-user-001",
      name: "Admin Estudio Glow",
      email: "yasitacardenas3637@gmail.com",
      password_hash: passwordHash,
      role: "admin",
    }).returning();

    console.log("✅ Usuario creado exitosamente:", {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      role: result[0].role,
    });

    console.log("🎉 Seed completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  }
}

seed();
