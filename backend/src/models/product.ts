// src/models/product.ts
// Drizzler schema for the Product entity

import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  price: int("price").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types inferred from the schema for convenience
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
