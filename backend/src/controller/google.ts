import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "crypto";
import { db } from "../db";
import { users } from "../models/relations";
import { eq } from "drizzle-orm";
import { validateBody } from "../middleware/validation";
import { GoogleAuthSchema } from "../schemas/google";
import { asyncHandler } from "../middleware/async-handler";
import { AuthenticationError, DatabaseError, ConflictError } from "../errors";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const TOKEN_MAX_AGE = 7 * 24 * 3600000; // 7 días en milisegundos
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new AuthenticationError("No se pudo obtener información del token de Google");
  }

  return {
    email: payload.email,
    name: payload.name,
    googleId: payload.sub,
    picture: payload.picture,
  };
}

export const googleAuth = [
  validateBody(GoogleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.setHeader("Warning", '299 - "Deprecated: Use /auth/google/register or /auth/google/login instead"');
    
    const { idToken } = req.body;
    const { email, name, googleId } = await verifyGoogleToken(idToken);

    // Buscar usuario por googleId o email
    let userResult = await db
      .select()
      .from(users)
      .where(eq(users.google_id, googleId));

    let user = userResult[0];

    if (!user) {
      // Buscar por email (puede existir como LOCAL)
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      user = userResult[0];

      if (user) {
        // Usuario existe con email pero sin googleId -> vincular cuenta
        await db
          .update(users)
          .set({ google_id: googleId, provider: "GOOGLE" })
          .where(eq(users.id, user.id));
        user.google_id = googleId;
        user.provider = "GOOGLE";
      } else {
        // Crear nuevo usuario
        const id = randomUUID();
        await db.insert(users).values({
          id,
          name: name || "Usuario Google",
          email,
          provider: "GOOGLE",
          google_id: googleId,
          role: "customer",
        });

        const newUserResult = await db
          .select()
          .from(users)
          .where(eq(users.id, id));
        user = newUserResult[0];

        if (!user) {
          throw new DatabaseError("Error al crear usuario con Google");
        }
      }
    }

    // Generar JWT interno
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_MAX_AGE,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      message: "Login con Google exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    });
  }),
];

export const googleRegister = [
  validateBody(GoogleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const { email, name, googleId } = await verifyGoogleToken(idToken);

    // Verificar si usuario ya existe con googleId
    const existingByGoogleId = await db
      .select()
      .from(users)
      .where(eq(users.google_id, googleId));

    if (existingByGoogleId.length > 0) {
      throw new ConflictError("El usuario ya está registrado con Google");
    }

    // Verificar si usuario ya existe con email (puede ser LOCAL o GOOGLE)
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingByEmail.length > 0) {
      const existingUser = existingByEmail[0];
      if (existingUser?.provider === "GOOGLE") {
        throw new ConflictError("El usuario ya está registrado con Google");
      } else {
        throw new ConflictError(
          "El email ya está registrado con contraseña. Usá login con contraseña o vinculá tu cuenta."
        );
      }
    }

    // Crear nuevo usuario
    const id = randomUUID();
    await db.insert(users).values({
      id,
      name: name || "Usuario Google",
      email,
      provider: "GOOGLE",
      google_id: googleId,
      role: "customer",
    });

    const newUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    const user = newUserResult[0];

    if (!user) {
      throw new DatabaseError("Error al crear usuario con Google");
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_MAX_AGE,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(201).json({
      message: "Registro con Google exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    });
  }),
];

export const googleLogin = [
  validateBody(GoogleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const { email, googleId } = await verifyGoogleToken(idToken);

    // Buscar usuario por googleId
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.google_id, googleId));

    if (userResult.length === 0) {
      throw new AuthenticationError(
        "Usuario no registrado. Por favor, registrate primero con Google."
      );
    }

    const user = userResult[0];

    if (!user) {
      throw new AuthenticationError("Usuario no encontrado");
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_MAX_AGE,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      message: "Login con Google exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
    });
  }),
];
