import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { generateOpenApi } from "./docs/openapi";
import productRouter from "./routes/products";
import categoryRouter from "./routes/categories";
import { authRouter } from "./routes/auth";
import usersRouter from "./routes/users";
import favoritesRouter from "./routes/favorites";
import { validateImageFile } from "./middleware/file-validation";
import { optimizeImage } from "./middleware/optimize";
import { csrfProtect } from "./middleware/csrf";
import { authLimiter } from "./middleware/rate-limit";
import { requestLogger } from "./middleware/request-logger";
import { logger } from "./lib/logger";
import healthRouter from "./routes/health";
import cors from "cors";
import {
  logErrors,
  clientErrorHandler,
  errorHandler,
} from "./middleware/error-handler";
import orderRouter from "./routes/orders";
import cartRouter from "./routes/cart";
import checkoutRouter from "./routes/checkout";
import dashboardRouter from "./routes/dashboard";
import webhooksRouter from "./routes/webhooks";
import { startCronJobs } from "./services/CronService";
import { env } from "./config/env";

const app = express();
const PORT = 3000;

// Trust the first proxy in front of the app (Render, Vercel edge, etc.) so that
// req.ip reflects the real client IP rather than the proxy's IP. Without this,
// every user appears to share the proxy's IP and rate-limiting blocks everyone.
app.set('trust proxy', 1);

// Structured request logging (first — captures everything below)
app.use(requestLogger);

// Security headers (CSP disabled — to be configured in a later phase)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://estudio-glow.onrender.com",
  env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check for Vercel preview URLs
      if (origin.match(/^https:\/\/estudio-glow-[a-zA-Z0-9-]+\.vercel\.app$/)) {
        return callback(null, true);
      }

      // Check for custom preview URL pattern
      const previewPattern = env.FRONTEND_URL_PREVIEW;
      if (previewPattern) {
        // Convert wildcard pattern to regex
        const regexPattern = previewPattern
          .replace(/\*/g, "[a-zA-Z0-9-]+")
          .replace(/\./g, "\\.");
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(origin)) {
          return callback(null, true);
        }
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(csrfProtect);
const upload = validateImageFile(5); // 5MB de límite

// Swagger documentation
const openApiDocument = generateOpenApi();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Health probes — placed before auth/csrf so orchestrators reach them without headers
app.use("/health", healthRouter);

// Admin routes (protected by auth middleware inside router)
app.use("/products", upload.single("image"), optimizeImage, productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authLimiter, authRouter);
app.use("/users", usersRouter);
app.use("/favorites", favoritesRouter);
app.use("/orders", orderRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/dashboard", dashboardRouter);
app.use("/api/webhooks", webhooksRouter);

// Start background workers
startCronJobs();
// Error handling middleware (DEBE IR AL FINAL, después de todas las rutas)
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  const isProduction = env.NODE_ENV === "production";
  const base = isProduction ? "https://estudio-glow.onrender.com" : `http://localhost:${PORT}`;
  logger.info({ port: PORT, base, env: env.NODE_ENV }, "server.listening");
  logger.info({ docs: `${base}/api-docs`, health: `${base}/health/ready` }, "endpoints");
});
