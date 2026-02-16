import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../models/user";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { validateBody } from "../middleware/validation";
import {
  RegisterSchema,
  LoginSchema,
  AuthResponseSchema,
} from "../schemas/auth";
import { asyncHandler } from "../middleware/async-handler";
import { ConflictError, AuthenticationError, DatabaseError } from "../errors";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const register = [
  validateBody(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

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

    await db.insert(users).values({
      id,
      name,
      email,
      password_hash: passwordHash,
      role: role || "customer",
    });

    const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(201).json({ message: "Usuario registrado exitosamente" });
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

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError("Credenciales inválidas");
    }

    const token = jwt.sign(
      { id: user?.id, email: user?.email, role: user?.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    const responseDto = AuthResponseSchema.safeParse({
      message: "Login exitoso",
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
    });

    if (!responseDto.success) {
      throw new DatabaseError("Error al procesar respuesta");
    }

    res.status(200).json(responseDto.data);
  }),
];

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout exitoso" });
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user) {
    throw new AuthenticationError("Token inválido o expirado");
  }

  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, user.id));

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
