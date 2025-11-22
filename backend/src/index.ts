import express from "express";
import cookieParser from "cookie-parser";
import productRouter from "./routes/products";
import { authRouter } from "./routes/auth";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando" });
});

// Admin routes (protected by auth middleware inside router)
app.use("/admin", productRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
