/**
 * Email verification controller — PR-2 + PR-3 handlers.
 *
 * verifyEmail       GET  /auth/verify-email?token=<raw>     (PR-2)
 * resendVerification POST /auth/resend-verification          (PR-2)
 * confirmLink       GET  /auth/confirm-link?token=<raw>     (PR-3 T3-05)
 *
 * Note: rate-limiting for resend-verification is applied as middleware in routes/auth.ts —
 * this controller never inspects the rate-limit window itself.
 *
 * Spec refs: F1.8, F1.9, F1.10, F1.11, N1.5, SEC1, S1-C, S1-D, S1-E, S1-G, S1-H
 *            F3.8, F3.9 (confirmLink)
 */

import type { Request, Response } from "express";
import { db } from "../db";
import { users } from "../models/relations";
import { env } from "../config/env";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../middleware/async-handler";
import AuthTokenService from "../services/AuthTokenService";
import { emailService } from "../services/email/index";

/**
 * GET /auth/verify-email?token=<rawToken>
 *
 * F1.8: Atomically consume an EMAIL_VERIFY token.
 * F1.9: On success set email_verified=true and 302-redirect to FE with ?status=ok.
 * SEC1: Set Referrer-Policy: no-referrer to prevent token leakage via referrer header.
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.query.token as string | undefined;

  // SEC1: Prevent token leakage via referrer header
  res.setHeader("Referrer-Policy", "no-referrer");

  if (!rawToken) {
    return res.redirect(`${env.FRONTEND_URL}/auth/verify-email?status=error&code=TOKEN_INVALID`);
  }

  try {
    // F1.8: Atomic UPDATE ... WHERE used_at IS NULL AND expires_at > now() RETURNING user_id
    const consumed = await AuthTokenService.consume(rawToken, "EMAIL_VERIFY");

    // F1.9: Set email_verified = true for the user
    await db
      .update(users)
      .set({ email_verified: true })
      .where(eq(users.id, consumed.user_id));

    // F1.9: Redirect to FE success page — token removed from URL (SEC prevents leakage)
    return res.redirect(`${env.FRONTEND_URL}/auth/verify-email?status=ok`);
  } catch {
    // F1.8: Expired, used, or non-existent token → same 302 with error (N1.3)
    return res.redirect(`${env.FRONTEND_URL}/auth/verify-email?status=error&code=TOKEN_INVALID`);
  }
});

/**
 * POST /auth/resend-verification
 * Body: { email: string }
 *
 * F1.10: Resend verification email for an unverified user.
 * F1.11: ALWAYS returns 200 with generic message — no information leaked.
 * N1.5: Email send failure propagates as 500 (controller does not suppress it).
 *
 * Rate limiting is NOT done here — the resendVerificationLimiter middleware in routes/auth.ts
 * handles throttling before this handler is reached (F1.12, design §7.2).
 */
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const GENERIC_RESPONSE = { message: "Si tu email es correcto recibirás un link en breve." };

  // Look up user — anti-enumeration: same 200 response for all paths
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()));

  if (userResult.length === 0) {
    // S1-G: Unknown email — respond 200 (anti-enumeration)
    return res.status(200).json(GENERIC_RESPONSE);
  }

  const user = userResult[0]!;

  if (user.email_verified) {
    // S1-H: Already verified — respond 200 (anti-enumeration)
    return res.status(200).json(GENERIC_RESPONSE);
  }

  // F1.10: Soft-invalidate prior tokens + issue new EMAIL_VERIFY token (24h TTL)
  // AuthTokenService.issue() handles invalidation internally before inserting the new token.
  const rawToken = await AuthTokenService.issue(user.id, "EMAIL_VERIFY", 24 * 60 * 60 * 1000);

  // F1.10c: Send verification email. N1.5: If send fails, error propagates as 500.
  // BACKEND_URL: link targets the backend endpoint that consumes the token and 302-redirects (W-2 fix)
  const verifyUrl = `${env.BACKEND_URL}/auth/verify-email?token=${rawToken}`;
  await emailService().sendVerificationEmail({ to: email, name: user.name, verifyUrl });

  return res.status(200).json(GENERIC_RESPONSE);
});

/**
 * GET /auth/confirm-link?token=<rawToken>
 *
 * T3-05: Consume an ACCOUNT_LINK token and set google_id on the user.
 *
 * F3.8: SEC1: Set Referrer-Policy: no-referrer (token leakage prevention)
 * F3.9: On success: UPDATE user.google_id = target_google_id, 302-redirect to FE ?status=ok
 * F3.6: drift check — if user.google_id is set AND differs from target_google_id → 409 redirect
 * F3.7: If user.google_id already equals target_google_id → 302 ok (idempotent)
 *
 * Design refs: Flow C (confirmLink path), Section 5.1
 */
export const confirmLink = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.query.token as string | undefined;
  const FRONTEND_CONFIRM = `${env.FRONTEND_URL}/auth/confirm-link`;

  // SEC1: Prevent token leakage via referrer header
  res.setHeader("Referrer-Policy", "no-referrer");

  if (!rawToken) {
    return res.redirect(`${FRONTEND_CONFIRM}?status=error&code=TOKEN_INVALID`);
  }

  try {
    // F3.9: Atomic consumption of ACCOUNT_LINK token — returns {user_id, target_google_id}
    const consumed = await AuthTokenService.consume(rawToken, "ACCOUNT_LINK");

    if (!consumed.target_google_id) {
      // Malformed token row — should never happen if token was issued correctly
      return res.redirect(`${FRONTEND_CONFIRM}?status=error&code=TOKEN_INVALID`);
    }

    const { user_id, target_google_id } = consumed;

    // Re-fetch current user to detect google_id drift (F3.6)
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, user_id));

    const user = userResult[0];
    if (!user) {
      return res.redirect(`${FRONTEND_CONFIRM}?status=error&code=TOKEN_INVALID`);
    }

    // F3.6: Drift check — user already linked a DIFFERENT google_id → 409 redirect
    if (user.google_id !== null && user.google_id !== target_google_id) {
      return res.redirect(`${FRONTEND_CONFIRM}?status=error&code=GOOGLE_ID_MISMATCH`);
    }

    // F3.7: Already linked to the same google_id → idempotent success
    // F3.9: Link the account
    if (user.google_id !== target_google_id) {
      await db
        .update(users)
        .set({ google_id: target_google_id })
        .where(eq(users.id, user_id));
    }

    return res.redirect(`${FRONTEND_CONFIRM}?status=ok`);
  } catch {
    // Expired, used, or non-existent token
    return res.redirect(`${FRONTEND_CONFIRM}?status=error&code=TOKEN_INVALID`);
  }
});
