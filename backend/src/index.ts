import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import productRouter from "./routes/products";
import { authRouter } from "./routes/auth";
import productCostumerRouter from "./routes/productCustomer";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API Estudio Glow - Documentación"
}));

// Admin routes (protected by auth middleware inside router)
app.use("/admin", productRouter);
app.use("/auth", authRouter);
app.use("/customer", productCostumerRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación API disponible en http://localhost:${PORT}/api-docs`);
});
