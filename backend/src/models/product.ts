import { mysqlTable, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { categories } from "./category";
import { sql } from "drizzle-orm";

export const products = mysqlTable("product", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  price: int("price").notNull(),
  stock: int("stock").notNull().default(0),
  categoryId: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
