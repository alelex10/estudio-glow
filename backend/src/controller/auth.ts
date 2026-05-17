import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../models/relations";
import { env } from "../config/env";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../middleware/validation";
import {
  RegisterSchema,
  LoginSchema,
  AuthResponseSchema,
  SetPasswordSchema,
} from "../schemas/auth";
import { asyncHandler } from "../middleware/async-handler";
import { ConflictError, AuthenticationError, DatabaseError, EmailNotVerifiedError } from "../errors";
import type { AuthRequest } from "../middleware/auth";
import AuthTokenService from "../services/AuthTokenService";
import { emailService } from "../services/email/index";

const TOKEN_MAX_AGE = 7 * 24 * 3600000; // 7 días en milisegundos

const isProduction = env.NODE_ENV === "production";

/**
 * @internal
 * Helper function para setear cookie de autenticación
 */
function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    maxAge: TOKEN_MAX_AGE,
    sameSite: isProduction ? "none" : "lax",
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
      if (existingUser[0].provider === "GOOGLE") {
        throw new ConflictError(
          "Este email ya tiene una cuenta de Google. Iniciá sesión con el botón de Google o, si ya iniciaste sesión, establecé una contraseña desde tu perfil.",
          "GOOGLE_ACCOUNT_EXISTS"
        );
      }
      throw new ConflictError(`El usuario con email ${email} ya existe`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const id = crypto.randomUUID();
    const userRole = "customer";

    // F1.2: Insert user — email_verified defaults to false via DB column default (F1.1)
    await db.insert(users).values({
      id,
      name,
      email,
      password_hash: passwordHash,
      provider: "LOCAL",
      role: userRole,
    });

    // F1.4: Issue EMAIL_VERIFY token (24h TTL). Raw token is NEVER stored — only the hash.
    const rawToken = await AuthTokenService.issue(id, "EMAIL_VERIFY", 24 * 60 * 60 * 1000);

    // F1.5: Send verification email. If send fails, user row remains with email_verified=false.
    // Log and swallow — user can request a resend (N1.5).
    // BACKEND_URL: the email link targets the backend endpoint that consumes the token and 302-redirects (W-2 fix)
    const verifyUrl = `${env.BACKEND_URL}/auth/verify-email?token=${rawToken}`;
    try {
      await emailService().sendVerificationEmail({ to: email, name, verifyUrl });
    } catch (err) {
      // Log the error but don't fail the request — user can request resend
      console.error("Failed to send verification email:", err);
    }

    // F1.3: Return 201 with pending_verification status — NO JWT, NO cookie (F1.1)
    res.status(201).json({ status: "pending_verification", email });
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
      throw new AuthenticationError("No existe una cuenta con este email. Registrate para continuar.");
    }

    const user = userResult[0];

    if (!user) {
      throw new AuthenticationError("Usuario no encontrado");
    }

    // Block Google-only users from password login
    if (!user.password_hash) {
      throw new AuthenticationError(
        "Esta cuenta usa Google para iniciar sesión. Usá el botón de Google o establecé una contraseña desde tu perfil.",
        "GOOGLE_NO_PASSWORD"
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError("Credenciales inválidas");
    }

    // F1.6: Hard-block LOCAL users with unverified email — no JWT issued
    if (!user.email_verified) {
      throw new EmailNotVerifiedError();
    }

    // F1.7: Email verified — issue JWT with email_verified claim (F6.1, F6.2)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, email_verified: user.email_verified },
      env.JWT_SECRET,
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

export const setPassword = [
  validateBody(SetPasswordSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { password } = req.body;
    const userId = req.user.id;
    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ password_hash: hashedPassword })
      .where(eq(users.id, userId));

    res.status(200).json({ status: "password_set" });
  }),
];
