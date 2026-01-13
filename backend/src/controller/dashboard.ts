import { asyncHandler } from "../middleware/async-handler";
import type { Request, Response } from "express";
import { db } from "../db";
import { products } from "../models/product";
import { lt } from "drizzle-orm";
import { categories } from "../models/category";
import { ResponseSchema } from "../schemas/response";

// GET STATS product
export const getProductStats = [
  asyncHandler(async (req: Request, res: Response) => {
    const total = await getTotalProducts();
    const lowStock = await getLowStockProducts();
    const totalCategory = await getTotalCategory();
    const withoutStock = await getWithoutStock();
    const totalValue = await getTotalValue();

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
const getTotalProducts = async () => {
  return db
    .select()
    .from(products)
    .then((result) => result.length);
};

// GET low stock products
const getLowStockProducts = async () => {
  return db
    .select()
    .from(products)
    .where(lt(products.stock, 10))
    .then((result) => result.length);
};

//GET total category
const getTotalCategory = async () => {
  return db
    .select()
    .from(categories)
    .then((result) => result.length);
};

//GET without stock
const getWithoutStock = async () => {
  return db
    .select()
    .from(products)
    .where(lt(products.stock, 0))
    .then((result) => result.length);
};

//GET total value
const getTotalValue = async () => {
  return db
    .select()
    .from(products)
    .then((result) =>
      result.reduce((acc, product) => acc + product.price * product.stock, 0)
    );
};
