import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { generateOpenApi } from "./docs/openapi";
import productRouter from "./routes/products";
import { authRouter } from "./routes/auth";
import productCostumerRouter from "./routes/productCustomer";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import { optimizeImage } from "./middleware/optimize";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Swagger documentation
const openApiDocument = generateOpenApi();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Admin routes (protected by auth middleware inside router)
app.use("/admin", upload.single('image'),optimizeImage, productRouter);
app.use("/auth", authRouter);
app.use("/customer", productCostumerRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
});
