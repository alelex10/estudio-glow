import { users } from "../../models/relations";
import bcrypt from "bcryptjs";

export type UserSeed = Omit<typeof users.$inferInsert, "id" | "password_hash"> & {
  password: string;
};

export const usersData: UserSeed[] = [
  {
    name: "Admin",
    email: "yasitacardenas3637@gmail.com",
    password: "estudioglow@423",
    role: "admin",
    provider: "LOCAL",
  },
  {
    name: "Eliz Vida",
    email: "elvizvida@gmail.com",
    password: "User@1234",
    role: "admin",
    provider: "LOCAL",
  },
];

export async function seedUsers(db: any) {
  const saltRounds = 10;
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
