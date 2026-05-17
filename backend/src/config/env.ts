import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

    DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),

    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),

    // FRONTEND_URL is required — used to build frontend redirect URLs (post-verify 302, etc.)
    FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
    FRONTEND_URL_PREVIEW: z.string().optional(),

    // BACKEND_URL is required — used as the base for backend-hosted token links in emails
    // (e.g. /auth/verify-email?token=..., /auth/confirm-link?token=...).
    // In split-origin deployments this differs from FRONTEND_URL.
    // Example: BACKEND_URL=http://localhost:3000 (or your backend's public URL in production)
    BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL"),

    SEED_DEFAULT_PASSWORD: z.string().default("change-me-in-dev"),

    MP_ACCESS_TOKEN: z.string().min(1, "MP_ACCESS_TOKEN is required"),
    MP_WEBHOOK_SECRET: z.string().optional(),

    // WEBHOOK_URL is the public URL MercadoPago uses to notify payment events.
    // Required in production; in dev/test a default placeholder is used with a boot warning.
    WEBHOOK_URL: z.string().url().optional(),

    PG_POOL_MAX: z.coerce.number().int().positive().optional(),
    PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),

    DISABLE_CRON: z.enum(["true", "false"]).optional(),

    // -------------------------------------------------------------------------
    // Email provider configuration (F4.8, S4-C)
    // -------------------------------------------------------------------------
    // EMAIL_PROVIDER selects which adapter to use at boot.
    // Conditional validation below ensures the matching credentials are present.
    EMAIL_PROVIDER: z.enum(["gmail", "resend"]),

    // Common — required for all providers
    EMAIL_FROM: z.string().min(3, "EMAIL_FROM is required (e.g. 'Estudio Glow <noreply@yourdomain.com>')"),

    // Gmail-specific (required when EMAIL_PROVIDER=gmail)
    GMAIL_USER: z.string().email().optional(),
    GMAIL_APP_PASSWORD: z.string().optional(),

    // Resend-specific (required when EMAIL_PROVIDER=resend)
    RESEND_API_KEY: z.string().optional(),
  })
  // Existing production guard for webhook secret
  .refine(
    (data) => data.NODE_ENV !== "production" || !!data.MP_WEBHOOK_SECRET,
    { message: "MP_WEBHOOK_SECRET is required in production", path: ["MP_WEBHOOK_SECRET"] },
  )
  // WEBHOOK_URL must be set in production so MercadoPago can notify payment events.
  .refine(
    (data) => data.NODE_ENV !== "production" || !!data.WEBHOOK_URL,
    { message: "WEBHOOK_URL is required in production", path: ["WEBHOOK_URL"] },
  )
  // Gmail credentials guard (F4.8): if EMAIL_PROVIDER=gmail, both user and password must be present
  .refine(
    (data) => data.EMAIL_PROVIDER !== "gmail" || (!!data.GMAIL_USER && !!data.GMAIL_APP_PASSWORD),
    {
      message: "GMAIL_USER and GMAIL_APP_PASSWORD are required when EMAIL_PROVIDER=gmail",
      path: ["GMAIL_USER"],
    },
  )
  // Resend API key guard (F4.8): if EMAIL_PROVIDER=resend, API key must be present
  .refine(
    (data) => data.EMAIL_PROVIDER !== "resend" || !!data.RESEND_API_KEY,
    {
      message: "RESEND_API_KEY is required when EMAIL_PROVIDER=resend",
      path: ["RESEND_API_KEY"],
    },
  );

export const env = EnvSchema.parse(process.env);

if (env.NODE_ENV !== "production" && !env.MP_WEBHOOK_SECRET) {
  console.warn("[env] MP_WEBHOOK_SECRET not set — webhook HMAC validation will fail");
}

if (env.NODE_ENV !== "production" && !env.WEBHOOK_URL) {
  console.warn("[env] WEBHOOK_URL not set — MercadoPago will use a placeholder URL (payments will not trigger webhooks)");
}
