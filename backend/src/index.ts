import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { generateOpenApi } from "./docs/openapi";
import productRouter from "./routes/products";
import categoryRouter from "./routes/categories";
import { authRouter } from "./routes/auth";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import { optimizeImage } from "./middleware/optimize";
import cors from "cors";
import {
  logErrors,
  clientErrorHandler,
  errorHandler,
} from "./middleware/error-handler";

const app = express();
const PORT = 3000;

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json());
app.use(cookieParser());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"));
    }
  },
});

// Swagger documentation
const openApiDocument = generateOpenApi();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Admin routes (protected by auth middleware inside router)
app.use("/products", upload.single("image"), optimizeImage, productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authRouter);

// Error handling middleware (DEBE IR AL FINAL, después de todas las rutas)
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log(
      `Servidor desplegado y funcionando en https://estudio-glow.onrender.com`
    );
    console.log(
      `API disponible para producción en https://estudio-glow.onrender.com/api-docs`
    );
  } else {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(
      `Documentación disponible en http://localhost:${PORT}/api-docs`
    );
  }
});
