import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),

  FRONTEND_URL: z.string().optional(),
  FRONTEND_URL_PREVIEW: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
