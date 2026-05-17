/**
 * Google authentication controller — PR-3 hardening.
 *
 * verifyGoogleToken  — T3-01: enforces payload.email_verified === true
 * resolveGoogleIdentity — T3-03: delegated to AuthService (Fix 4.1)
 * googleRegister     — delegates to AuthService.resolveGoogleIdentity
 * googleLogin        — delegates to AuthService.resolveGoogleIdentity
 *
 * REMOVED: googleAuth (deprecated POST /auth/google) — T3-04
 *
 * Spec refs: F3.1–F3.7, F3.9
 * Design refs: Section 1 (Flow C), Section 5.1 (endpoint table)
 */

import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { validateBody } from "../middleware/validation";
import { GoogleAuthSchema } from "../schemas/google";
import { asyncHandler } from "../middleware/async-handler";
import {
  AuthenticationError,
  GoogleEmailUnverifiedError,
} from "../errors";
import { env } from "../config/env";
import { resolveGoogleIdentity } from "../services/AuthService";

const TOKEN_MAX_AGE = 7 * 24 * 3600000; // 7 days in ms
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
const isProduction = env.NODE_ENV === "production";

/**
 * T3-01: Verifies a Google ID token.
 *
 * Enforces payload.email_verified === true (F3.5).
 * Throws GoogleEmailUnverifiedError (401) if Google hasn't verified the email.
 * Returns { email, name, googleId, picture }.
 */
async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name: string;
  googleId: string;
  picture: string | undefined;
  emailVerified: true;
}> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new AuthenticationError("No se pudo obtener información del token de Google");
  }

  // T3-01: Hard enforcement — Google unverified emails are rejected (F3.5)
  // If this guard throws, the return below is never reached.
  if (payload.email_verified !== true) {
    throw new GoogleEmailUnverifiedError();
  }

  // F2.3: Return shape includes emailVerified: true (literal) — only reachable after the guard above.
  return {
    email: payload.email,
    name: payload.name ?? "Usuario Google",
    googleId: payload.sub,
    picture: payload.picture,
    emailVerified: true,
  };
}

/**
 * Builds a JWT and sets the auth cookie on `res`.
 */
function issueJwt(
  res: Response,
  user: { id: string; email: string; role: string; email_verified: boolean },
): string {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    maxAge: TOKEN_MAX_AGE,
    sameSite: isProduction ? "none" : "lax",
  });

  return token;
}

/**
 * T3-03: Unified Google identity resolver — now delegated to AuthService (Fix 4.1).
 *
 * Translates the AuthService result discriminated union into HTTP responses.
 *
 *   C1  — No user by googleId or email  → create GOOGLE user, JWT (201)
 *   C2  — User by googleId exists       → JWT (200) [already linked]
 *   F3.7— User by googleId AND by email, they are the same → JWT (200) [normal]
 *   F3.6— User by googleId AND by email are DIFFERENT records → 409 GOOGLE_ID_MISMATCH
 *   C3a — LOCAL email match, email_verified=false → SILENT MERGE + JWT (200)
 *   C3b — LOCAL email match, email_verified=true, google_id=NULL → ACCOUNT_LINK email (202)
 */
async function handleGoogleIdentity(
  res: Response,
  payload: { email: string; googleId: string; name: string; picture: string | undefined },
): Promise<void> {
  const result = await resolveGoogleIdentity(payload);

  switch (result.outcome) {
    case "jwt": {
      const { user } = result;
      const token = issueJwt(res, {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
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
          email_verified: user.email_verified,
        },
      });
      return;
    }

    case "silent_merge": {
      const { user } = result;
      const token = issueJwt(res, {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: true,
      });
      res.status(200).json({
        message: "Cuenta LOCAL vinculada automáticamente con Google (tu email quedó verificado)",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: user.provider,
          email_verified: true,
          silent_merge: true,
        },
      });
      return;
    }

    case "link_email_sent": {
      res.status(202).json({
        status: "link_email_sent",
        email: result.email,
      });
      return;
    }

    case "created": {
      const { user } = result;
      const token = issueJwt(res, {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: true,
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
          email_verified: true,
        },
      });
      return;
    }
  }
}

/**
 * POST /auth/google/register
 *
 * Verifies Google token and delegates to AuthService.resolveGoogleIdentity.
 * Handles: C1 (new user), C3a (silent merge), C3b (link email), F3.6 (mismatch).
 */
export const googleRegister = [
  validateBody(GoogleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    const { email, name, googleId, picture } = await verifyGoogleToken(idToken);
    await handleGoogleIdentity(res, { email, googleId, name, picture });
  }),
];

/**
 * POST /auth/google/login
 *
 * Verifies Google token and delegates to AuthService.resolveGoogleIdentity.
 * Handles: C2 (returning user), C3a (silent merge), C3b (link email), F3.6 (mismatch),
 *          C1 (new user — first-time login treated same as register).
 */
export const googleLogin = [
  validateBody(GoogleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    const { email, name, googleId, picture } = await verifyGoogleToken(idToken);
    await handleGoogleIdentity(res, { email, googleId, name, picture });
  }),
];

// NOTE: googleAuth (deprecated POST /auth/google) has been REMOVED — T3-04.
// The route was removed from routes/auth.ts simultaneously.
// Frontend never called it (confirmed in explore phase).
