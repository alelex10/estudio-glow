import { users } from "../../models/relations";
import { env } from "../../config/env";
import bcrypt from "bcryptjs";

export type UserSeed = Omit<typeof users.$inferInsert, "id" | "password_hash"> & {
  password: string;
};

function getUsersData(): UserSeed[] {
  const password = env.SEED_DEFAULT_PASSWORD;

  if (password === "change-me-in-dev") {
    console.warn("⚠️  Usando password default para seeds. Seteá SEED_DEFAULT_PASSWORD para entornos no-dev.");
  }

  return [
    {
      name: "Admin",
      email: "yasitacardenas3637@gmail.com",
      password,
      role: "admin",
      provider: "LOCAL",
    },
    {
      name: "Eliz Vida",
      email: "elvizvida@gmail.com",
      password,
      role: "admin",
      provider: "LOCAL",
    },
  ];
}

export async function seedUsers(db: any) {
  const saltRounds = 10;
  const usersData = getUsersData();

  const usersWithHashedPasswords = await Promise.all(
    usersData.map(async (user) => ({
      name: user.name,
      email: user.email,
      password_hash: await bcrypt.hash(user.password, saltRounds),
      role: user.role,
    }))
  );

  const inserted = await db.insert(users).values(usersWithHashedPasswords).returning();

  return inserted;
}
