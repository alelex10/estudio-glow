import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";
import { relations } from "./models/relations";

dotenv.config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "estudio_glow",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export a Drizzler instance bound to the pool
export const db = drizzle({ client: pool, relations: relations });

export default db;
