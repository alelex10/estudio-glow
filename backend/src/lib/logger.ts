import pino from "pino";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: { service: "estudio-glow-backend" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-signature']",
      "*.password",
      "*.token",
      "*.idToken",
      "*.JWT_SECRET",
    ],
    censor: "[REDACTED]",
  },
  ...(isProduction
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } } }),
});
