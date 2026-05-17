import crypto from "crypto";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { authTokens } from "../models/auth-token";
import { AppError } from "../errors/index";

// Token types as a const enum-like object for type safety
export type TokenType = "EMAIL_VERIFY" | "ACCOUNT_LINK";

export interface TokenExtras {
  target_google_id?: string;
}

export interface ConsumedToken {
  user_id: string;
  type: TokenType;
  target_google_id: string | null;
}

/**
 * Generates the raw token (43-char URL-safe base64) and returns its SHA-256 hex hash.
 * The raw token is NEVER stored anywhere — only the hash (N1.1).
 */
function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url"); // 43 chars, URL-safe, SEC2
  const hash = crypto.createHash("sha256").update(raw).digest("hex"); // 64-char hex
  return { raw, hash };
}

/**
 * Computes SHA-256 hex hash of the given raw token string.
 * Used during token consumption to look up by hash.
 */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

const AuthTokenService = {
  /**
   * Issues a new token for the given user and type.
   *
   * Steps:
   * 1. Invalidate any prior unused tokens of the same type for this user
   *    (prevents stale tokens piling up after resend — design §3)
   * 2. Insert a new auth_tokens row with hash + TTL
   * 3. Return the raw token (caller hands it to EmailService; it is NEVER persisted)
   *
   * @param userId - The user the token belongs to
   * @param type - Token type: EMAIL_VERIFY | ACCOUNT_LINK
   * @param ttlMs - Time-to-live in milliseconds (e.g., 24h = 86_400_000)
   * @param extras - Optional extra fields (target_google_id for ACCOUNT_LINK)
   * @returns Raw token string to embed in email link
   */
  async issue(
    userId: string,
    type: TokenType,
    ttlMs: number,
    extras?: TokenExtras,
  ): Promise<string> {
    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + ttlMs);

    // 1. Soft-invalidate all prior unused tokens of this type for this user
    //    (used_at = now() marks them as consumed without deleting — preserves audit trail)
    await db
      .update(authTokens)
      .set({ used_at: new Date() })
      .where(
        and(
          eq(authTokens.user_id, userId),
          eq(authTokens.type, type),
          isNull(authTokens.used_at),
        ),
      );

    // 2. Insert the new token row — only the hash is persisted (N1.1)
    await db.insert(authTokens).values({
      user_id: userId,
      token_hash: hash,
      type,
      target_google_id: extras?.target_google_id ?? null,
      expires_at: expiresAt,
    });

    // 3. Return raw token — caller must not log this value (SEC3)
    return raw;
  },

  /**
   * Atomically consumes a token.
   *
   * Uses a single UPDATE ... WHERE ... RETURNING to claim the token.
   * Two concurrent requests for the same token will produce exactly one
   * winner (UPDATE returns 1 row) and one loser (UPDATE returns 0 rows → TOKEN_INVALID).
   * This is the race-safe consumption pattern (N1.2).
   *
   * @param rawToken - Raw token from the email link query param
   * @param type - Expected token type (prevents cross-type consumption)
   * @returns Consumed token metadata (user_id, type, target_google_id)
   * @throws AppError TOKEN_INVALID (410) if token is expired, used, or non-existent
   */
  async consume(rawToken: string, type: TokenType): Promise<ConsumedToken> {
    const hash = hashToken(rawToken);
    const now = new Date();

    // Atomic single-statement claim — winner gets the row, loser gets empty array (N1.2)
    const rows = await db
      .update(authTokens)
      .set({ used_at: now })
      .where(
        and(
          eq(authTokens.token_hash, hash),
          eq(authTokens.type, type),
          isNull(authTokens.used_at),
          gt(authTokens.expires_at, now),
        ),
      )
      .returning({
        user_id: authTokens.user_id,
        type: authTokens.type,
        target_google_id: authTokens.target_google_id,
      });

    if (rows.length === 0) {
      // Expired, used, or non-existent — same error code to prevent timing oracle (N1.3)
      throw new AppError("Token invalid, expired, or already used.", 410, "TOKEN_INVALID");
    }

    const row = rows[0]!;
    return {
      user_id: row.user_id,
      type: row.type as TokenType,
      target_google_id: row.target_google_id ?? null,
    };
  },

  /**
   * Invalidates all unused tokens of the given type for a user.
   * Used by resend-verification to ensure only the newest token is active.
   * (This is also called inside issue() automatically, but exposed separately
   * for cases where you want to invalidate without issuing a new token.)
   */
  async invalidateAll(userId: string, type: TokenType): Promise<void> {
    await db
      .update(authTokens)
      .set({ used_at: new Date() })
      .where(
        and(
          eq(authTokens.user_id, userId),
          eq(authTokens.type, type),
          isNull(authTokens.used_at),
        ),
      );
  },
};

export default AuthTokenService;
