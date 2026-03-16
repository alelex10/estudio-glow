import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/models/relations";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function testLogin() {
  try {
    console.log("🔐 Probando login...");
    
    const email = "yasitacardenas3637@gmail.com";
    const password = "estudioglow@423";
    
    // Buscar usuario
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (userResult.length === 0) {
      console.log("❌ Usuario no encontrado");
      return;
    }
    
    const user = userResult[0];
    console.log("✅ Usuario encontrado:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("🔑 Contraseña correcta:", isMatch);
    
    if (isMatch) {
      console.log("🎉 Login exitoso! El usuario debería poder autenticarse.");
    } else {
      console.log("❌ Contraseña incorrecta");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testLogin();
