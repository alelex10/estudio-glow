import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticationError, AuthorizationError, EmailNotVerifiedError } from "../errors";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  // F6.1: email_verified claim added in PR-2. May be absent in tokens issued before this change.
  email_verified?: boolean;
}

/** Usuario autenticado vía JWT — contiene solo lo que está en el token */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  // F6.4: emailVerified parsed from JWT claim — no extra DB read per request
  emailVerified: boolean;
}

/** Request que ya pasó por el middleware authenticate */
export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    throw new AuthenticationError("Token de autenticación faltante");
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    // F6.4: Expose emailVerified from JWT claim.
    // F6.5 / S6-B: Existing JWTs without the claim default to false — no crash (backward compat).
    (req as AuthRequest).user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.email_verified === true,
    };
    next();
  } catch {
    throw new AuthenticationError("Token inválido o expirado");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;

  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Se requieren privilegios de administrador");
  }

  next();
}

export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;

  if (!user || user.role !== "customer") {
    throw new AuthorizationError("Se requieren privilegios de cliente");
  }

  next();
}

/**
 * F6.5: Guard middleware — rejects requests where the authenticated user's
 * email is not verified. Must be applied AFTER `authenticate`.
 *
 * Returns HTTP 403 { code: "EMAIL_NOT_VERIFIED" }.
 * Not applied to any route in PR-2 — provided for future route protection.
 * The issuance block in login is sufficient to prevent unverified JWTs from existing.
 */
export function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthRequest).user;

  if (!user || !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  next();
}
