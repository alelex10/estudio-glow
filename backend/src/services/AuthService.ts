/**
 * AuthService — business logic for Google identity resolution.
 *
 * resolveGoogleIdentity wraps all 6 cases (C1, C2, C3a, C3b, F3.6, F3.7)
 * from design §1 Flow C inside a single db.transaction so INSERT + lookups
 * are atomic (Fix 4.1).
 *
 * Uses UserRepository for all DB access (Fix 4.2).
 * Purges password_hash on silent merge via UserRepository.linkGoogle (Fix 5.5).
 */

import { randomUUID } from "crypto";
import { db } from "../db";
import { UserRepository } from "../repositories/UserRepository";
import type { User } from "../repositories/UserRepository";
import {
  DatabaseError,
  GoogleIdMismatchError,
} from "../errors";
import AuthTokenService from "./AuthTokenService";
import { emailService } from "./email/index";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export interface GooglePayload {
  email: string;
  googleId: string;
  name: string;
  picture: string | undefined;
}

export type GoogleIdentityResult =
  | { outcome: "jwt"; user: User }
  | { outcome: "link_email_sent"; email: string }
  | { outcome: "silent_merge"; user: User }
  | { outcome: "created"; user: User };

/**
 * Resolves a Google identity against the user table.
 *
 * All DB mutations are wrapped in a single transaction.
 *
 * Returns a discriminated union describing what happened so the caller
 * (controller) can build the HTTP response — no direct coupling to
 * `req` / `res` here.
 */
export async function resolveGoogleIdentity(
  payload: GooglePayload,
): Promise<GoogleIdentityResult> {
  const { email, googleId, name, picture } = payload;

  return db.transaction(async (tx) => {
    // Drizzle transaction type is compatible with db for our repo pattern
    const txDb = tx as unknown as typeof db;

    const userByGoogleId = await UserRepository.findByGoogleId(googleId, txDb);
    const userByEmail = await UserRepository.findByEmail(email);

    // --- F3.6: Both records found but they are DIFFERENT users ---
    if (
      userByGoogleId &&
      userByEmail &&
      userByGoogleId.id !== userByEmail.id
    ) {
      throw new GoogleIdMismatchError();
    }

    // --- C2 / F3.7: User found by googleId (same record or no email conflict) ---
    if (userByGoogleId) {
      logger.debug({ userId: userByGoogleId.id }, "resolveGoogleIdentity: C2/F3.7 returning user");
      return { outcome: "jwt", user: userByGoogleId } as GoogleIdentityResult;
    }

    // --- C3: LOCAL email match (no googleId match) ---
    if (userByEmail) {
      // C3a: email_verified=false → SILENT MERGE (set google_id + mark verified + purge password_hash)
      if (!userByEmail.email_verified) {
        const merged = await UserRepository.linkGoogle(userByEmail.id, googleId, txDb);
        if (!merged) throw new DatabaseError("Error al vincular cuenta con Google");
        logger.debug({ userId: userByEmail.id }, "resolveGoogleIdentity: C3a silent merge");
        return { outcome: "silent_merge", user: merged } as GoogleIdentityResult;
      }

      // C3b: email_verified=true, google_id=NULL → ACCOUNT_LINK email flow (202, NO JWT)
      const rawToken = await AuthTokenService.issue(
        userByEmail.id,
        "ACCOUNT_LINK",
        10 * 60 * 1000, // 10 minutes
        { target_google_id: googleId },
      );

      const linkUrl = `${env.BACKEND_URL}/auth/confirm-link?token=${rawToken}`;
      await emailService().sendAccountLinkEmail({
        to: userByEmail.email,
        name: userByEmail.name,
        linkUrl,
        googleEmail: email,
      });

      logger.debug({ userId: userByEmail.id }, "resolveGoogleIdentity: C3b link email sent");
      return { outcome: "link_email_sent", email: userByEmail.email } as GoogleIdentityResult;
    }

    // --- C1: No user by googleId or email → create new GOOGLE user ---
    const newUser = await UserRepository.create(
      {
        id: randomUUID(),
        name,
        email,
        provider: "GOOGLE",
        google_id: googleId,
        role: "customer",
        email_verified: true, // Google has already verified the email (F3.5 gate in controller)
      },
      txDb,
    );

    logger.debug({ userId: newUser.id }, "resolveGoogleIdentity: C1 new Google user created");
    return { outcome: "created", user: newUser } as GoogleIdentityResult;
  });
}
