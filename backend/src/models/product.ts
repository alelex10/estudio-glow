import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categories } from "./category";

export const products = pgTable("product", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
