import type { Request, Response } from "express";
import { db } from "../db";
import { users } from "../models/relations";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../middleware/async-handler";
import { AuthenticationError } from "../errors";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as any).user;

  if (!authUser) {
    throw new AuthenticationError("No autenticado");
  }

  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      provider: users.provider,
      created_at: users.created_at,
    })
    .from(users)
    .where(eq(users.id, authUser.id));

  if (userResult.length === 0) {
    throw new AuthenticationError("Usuario no encontrado");
  }

  res.status(200).json({ user: userResult[0] });
});
