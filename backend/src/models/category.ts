// src/models/category.ts
// Drizzle schema for the Category entity

import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const categories = mysqlTable("category", {
  id: serial("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
