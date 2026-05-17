/**
 * EmailService factory — reads EMAIL_PROVIDER env var and returns the matching adapter.
 *
 * If EMAIL_PROVIDER is absent or an unknown value, throws at call time (server does NOT start).
 * Env var validation is enforced by Zod in src/config/env.ts — by the time this factory
 * is called, the required vars are guaranteed present.
 *
 * Spec refs: F4.4
 * Design refs: Section 4.3 (Factory)
 */
import { env } from "../../config/env";
import type { EmailService } from "./EmailService";
import { GmailSmtpAdapter } from "./GmailSmtpAdapter";
import { ResendAdapter } from "./ResendAdapter";

export type { EmailService } from "./EmailService";
export { GmailSmtpAdapter } from "./GmailSmtpAdapter";
export { ResendAdapter } from "./ResendAdapter";

function createEmailService(): EmailService {
  switch (env.EMAIL_PROVIDER) {
    case "gmail":
      return new GmailSmtpAdapter({
        user: env.GMAIL_USER!,
        pass: env.GMAIL_APP_PASSWORD!,
        from: env.EMAIL_FROM!,
      });
    case "resend":
      return new ResendAdapter({
        apiKey: env.RESEND_API_KEY!,
        from: env.EMAIL_FROM!,
      });
    default: {
      // TypeScript should never reach this thanks to Zod enum validation,
      // but the runtime guard is kept for safety (F4.4).
      throw new Error(
        `[EmailService] Unknown EMAIL_PROVIDER: "${env.EMAIL_PROVIDER as string}". ` +
          `Supported values: "gmail", "resend".`,
      );
    }
  }
}

// Singleton — lazy-initialized on first call.
// PR-1 is DORMANT: this module is exported but not imported by index.ts yet.
// PR-2 will wire it into the auth controller.
let _svc: EmailService | null = null;

export const emailService = (): EmailService => (_svc ??= createEmailService());
