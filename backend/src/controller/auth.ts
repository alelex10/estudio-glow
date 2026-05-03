import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../models/relations";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import {
  RegisterSchema,
  LoginSchema,
  AuthResponseSchema,
} from "../schemas/auth";
import { asyncHandler } from "../middleware/async-handler";
import { ConflictError, AuthenticationError, DatabaseError } from "../errors";
import type { AuthRequest } from "../middleware/auth";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos en milisegundos

/**
 * @internal
 * Helper function para setear cookie de autenticación
 */
function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_MAX_AGE,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
}

/**
 * @internal
 * Helper function para construir respuesta de autenticación
 */
function buildAuthResponse(
  message: string,
  user: { id: string; name: string; email: string; role: string; provider: string }
): z.infer<typeof AuthResponseSchema> {
  const responseDto = AuthResponseSchema.safeParse({
    message,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
    },
  });

  if (!responseDto.success) {
    throw new DatabaseError("Error al procesar respuesta");
  }

  return responseDto.data;
}

export const register = [
  validateBody(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      throw new ConflictError(`El usuario con email ${email} ya existe`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const id = crypto.randomUUID();
    const userRole = "customer";

    await db.insert(users).values({
      id,
      name,
      email,
      password_hash: passwordHash,
      provider: "LOCAL",
      role: userRole,
    });

    const token = jwt.sign({ id, email, role: userRole }, JWT_SECRET, { expiresIn: "7d" });

    setAuthCookie(res, token);

    const response = buildAuthResponse("Usuario registrado exitosamente", {
      id,
      name,
      email,
      role: userRole,
      provider: "LOCAL",
    });

    res.status(201).json({ ...response, token });
  }),
];

export const login = [
  validateBody(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (userResult.length === 0) {
      throw new AuthenticationError("Credenciales inválidas");
    }

    const user = userResult[0];

    if (!user) {
      throw new AuthenticationError("Usuario no encontrado");
    }

    // Block Google-only users from password login
    if (!user.password_hash) {
      throw new AuthenticationError(
        "Esta cuenta usa Google para iniciar sesión. Usá el botón de Google."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError("Credenciales inválidas");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);

    const response = buildAuthResponse("Login exitoso", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
    });

    res.status(200).json({ ...response, token });
  }),
];

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout exitoso" });
});

export const verifyToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, req.user.id));

  if (userResult.length === 0) {
    throw new AuthenticationError("Usuario no encontrado");
  }

  const responseDto = AuthResponseSchema.safeParse({
    message: "Token válido",
    user: userResult[0],
  });

  if (!responseDto.success) {
    throw new DatabaseError("Error al procesar respuesta");
  }

  res.status(200).json(responseDto.data);
});
