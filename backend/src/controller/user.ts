import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/async-handler";
import { AuthenticationError } from "../errors";
import { UserRepository } from "../repositories/UserRepository";

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await UserRepository.findPublicById(req.user.id);

  if (!user) {
    throw new AuthenticationError("Usuario no encontrado");
  }

  res.status(200).json({ user });
});
