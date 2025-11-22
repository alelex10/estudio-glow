import express from "express";
import cookieParser from "cookie-parser";
import productRouter from "./routes/products";
import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());


const db = drizzle({ connection: { uri: process.env.DATABASE_URL }});

// Public route
app.get("/", (req, res) => {
  res.json({ message: "Servidor con Bun + Express funcionando 🚀" });
});

// Admin routes (protected by auth middleware inside router)
app.use("/admin", productRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
