import { db } from "../db";
import { users } from "../models/user";
import { eq } from "drizzle-orm";
import type { User, NewUser } from "../models/user";

export type { User, NewUser };

/** Subset of user fields safe to return to the client. */
export type PublicUser = Pick<User, "id" | "name" | "email" | "role" | "provider" | "created_at">;

export class UserRepository {
  static async findById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  static async findPublicById(id: string): Promise<PublicUser | undefined> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        provider: users.provider,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  static async findByGoogleId(googleId: string, tx?: typeof db): Promise<User | undefined> {
    const client = tx ?? db;
    const result = await (client as typeof db)
      .select()
      .from(users)
      .where(eq(users.google_id, googleId))
      .limit(1);
    return result[0];
  }

  /** INSERT … RETURNING * — never does a second SELECT. */
  static async create(data: NewUser, tx?: typeof db): Promise<User> {
    const client = tx ?? db;
    const [created] = await (client as typeof db)
      .insert(users)
      .values(data)
      .returning();
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  /** UPDATE … RETURNING * — returns null when the row is not found. */
  static async update(
    id: string,
    data: Partial<NewUser>,
    tx?: typeof db,
  ): Promise<User | null> {
    const client = tx ?? db;
    const [updated] = await (client as typeof db)
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated ?? null;
  }

  /**
   * Links a Google identity to an existing user.
   * Also sets email_verified = true and nullifies password_hash (Fix 5.5).
   * Used in the silent-merge case (C3a).
   */
  static async linkGoogle(
    userId: string,
    googleId: string,
    tx?: typeof db,
  ): Promise<User | null> {
    const client = tx ?? db;
    const [updated] = await (client as typeof db)
      .update(users)
      .set({
        google_id: googleId,
        email_verified: true,
        password_hash: null, // Fix 5.5: purge attacker's password_hash on silent merge
      })
      .where(eq(users.id, userId))
      .returning();
    return updated ?? null;
  }

  /** Marks a user's email as verified — no return value needed. */
  static async markVerified(userId: string, tx?: typeof db): Promise<void> {
    const client = tx ?? db;
    await (client as typeof db)
      .update(users)
      .set({ email_verified: true })
      .where(eq(users.id, userId));
  }
}
