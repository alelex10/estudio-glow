import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limiter for authentication endpoints.
 *
 * 10 requests per minute per IP. In-memory store — sufficient for a single
 * Render instance. For multi-instance deployments, switch to a Redis store
 * via the `rate-limit-redis` package (drop-in `store` option replacement).
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { message: "Too many authentication attempts. Try again in a minute." } },
});

/**
 * Rate limiter for POST /auth/resend-verification — 1 request per 60 seconds per email.
 *
 * Key decisions:
 * - keyGenerator: normalized email address (lowercased) — NOT the IP (F1.12, spec §7.1).
 * - handler: returns HTTP 200 with anti-enumeration body — NOT 429 (F1.11, SEC4).
 *   Surfacing 429 would let attackers distinguish registered emails from unknown ones.
 * - skip: if req.body.email is absent, skip the limiter so Zod validation rejects
 *   the malformed request with 400. Without skipping, all malformed requests would
 *   share the empty-string key and silently throttle everyone.
 *
 * In-memory store — single-instance only (N1.4).
 * Migration path: replace `store` option with `rate-limit-redis` when scaling beyond
 * a single Render instance. Same library, same surface area as authLimiter migration path.
 *
 * Spec refs: F1.11, F1.12, N1.4, SEC4
 * Design refs: Section 7.1 (resendVerificationLimiter)
 */
export const resendVerificationLimiter = rateLimit({
  windowMs: 60_000,
  limit: 1,
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req.body?.email ?? "").toString().toLowerCase(),
  // Override default 429 with 200 anti-enumeration response (F1.11, SEC4)
  handler: (_req: Request, res: Response) => {
    res.status(200).json({ message: "Si tu email es correcto recibirás un link en breve." });
  },
  // Skip limiter when email is missing — Zod validation will handle the 400 rejection
  skip: (req: Request) => !req.body?.email,
});
