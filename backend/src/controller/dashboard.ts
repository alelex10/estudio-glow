import { asyncHandler } from "../middleware/async-handler";
import type { Request, Response } from "express";
import { db } from "../db";
import { products } from "../models/product";
import { count, eq, lt, sql } from "drizzle-orm";
import { categories } from "../models/category";
import { ResponseSchema } from "../schemas/response";

// GET STATS product
export const getProductStats = [
  asyncHandler(async (req: Request, res: Response) => {
    const [total, lowStock, totalCategory, withoutStock, totalValue] =
      await Promise.all([
        getTotalProducts(),
        getLowStockProducts(),
        getTotalCategory(),
        getWithoutStock(),
        getTotalValue(),
      ]);

    res.json(
      ResponseSchema.parse({
        message: "Success",
        data: {
          total,
          lowStock,
          totalCategory,
          withoutStock,
          totalValue,
        },
      })
    );
  }),
];

// GET total products
const getTotalProducts = async (): Promise<number> => {
  const [result] = await db.select({ count: count() }).from(products);
  return result?.count ?? 0;
};

// GET low stock products
const getLowStockProducts = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(lt(products.stock, 10));
  return result?.count ?? 0;
};

// GET total categories
const getTotalCategory = async (): Promise<number> => {
  const [result] = await db.select({ count: count() }).from(categories);
  return result?.count ?? 0;
};

// GET without stock
const getWithoutStock = async (): Promise<number> => {
  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.stock, 0));
  return result?.count ?? 0;
};

// GET total value (suma de price * stock)
const getTotalValue = async (): Promise<number> => {
  const [result] = await db
    .select({ total: sql<number>`coalesce(sum(${products.price} * ${products.stock}), 0)` })
    .from(products);
  return result?.total ?? 0;
};
