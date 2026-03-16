import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/models/relations";
import { eq } from "drizzle-orm";

async function checkUser() {
  try {
    const result = await db.select().from(users).where(eq(users.email, "yasitacardenas3637@gmail.com"));
    console.log("🔍 Verificando usuario en la base de datos...");
    
    if (result.length > 0) {
      console.log("✅ Usuario encontrado:", {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        role: result[0].role,
        hasPasswordHash: !!result[0].password_hash,
      });
    } else {
      console.log("❌ Usuario no encontrado");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkUser();
