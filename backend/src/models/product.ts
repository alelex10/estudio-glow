// src/models/product.ts
// Drizzler schema for the Product entity

import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable("product", {
  id: serial("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  price: int("price").notNull(),
  stock: int("stock").notNull().default(0),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
