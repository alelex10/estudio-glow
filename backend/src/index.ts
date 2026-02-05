import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { generateOpenApi } from "./docs/openapi";
import productRouter from "./routes/products";
import categoryRouter from "./routes/categories";
import { authRouter } from "./routes/auth";
import { validateImageFile } from "./middleware/file-validation";
import cors from "cors";
import {
  logErrors,
  clientErrorHandler,
  errorHandler,
} from "./middleware/error-handler";
import dashboardRouter from "./routes/dashboard";

const app = express();
const PORT = 3000;

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
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
      const previewPattern = process.env.FRONTEND_URL_PREVIEW;
      if (previewPattern) {
        // Convert wildcard pattern to regex
        const regexPattern = previewPattern
          .replace(/\*/g, '[a-zA-Z0-9-]+')
          .replace(/\./g, '\\.');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(origin)) {
          return callback(null, true);
        }
      }
      
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(cookieParser());
const upload = validateImageFile(5); // 5MB de límite

// Swagger documentation
const openApiDocument = generateOpenApi();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Admin routes (protected by auth middleware inside router)
app.use("/products", upload.single("image"), productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);

// Error handling middleware (DEBE IR AL FINAL, después de todas las rutas)
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === "production";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (isProduction) {
    console.log(`Servidor desplegado y funcionando en ${frontendUrl}`);
    console.log(
      `API disponible para producción en ${frontendUrl}/api-docs`
    );
  } else {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(
      `Documentación disponible en http://localhost:${PORT}/api-docs`
    );
  }
});
