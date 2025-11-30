import type { Request, Response } from "express";
import { eq, like, and, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { products } from "../models/product";
import type { NewProduct } from "../models/product";
import { validateBody, validateQuery } from "../middleware/validation";
import { CreateProductSchema, UpdateProductSchema, SearchProductSchema } from "../schemas/product";

// GET all products
export async function listProducts(req: Request, res: Response) {
  try {
    const result = await db.select().from(products);
    if (result.length === 0)
      return res.status(404).json({ message: "No products are available" });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

// GET product by ID
export async function getProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const result = await db.select().from(products).where(eq(products.id, id));

    if (result.length === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
}

// CREATE product
export const createProduct = [
  validateBody(CreateProductSchema),
  async (req: Request, res: Response) => {
    const data: NewProduct = req.body;

    try {
      const exists = await db
        .select()
        .from(products)
        .where(eq(products.name, data.name));

      if (exists.length > 0)
        return res.status(400).json({
          message:
            "El producto de nombre " +
            data.name +
            " ya existe solo se le puede subir o bajar el stock",
        });

      const [result] = await db.insert(products).values(data);
      const created = await db
        .select()
        .from(products)
        .where(eq(products.id, result.insertId));

      res.status(201).json(created[0]);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create product" });
    }
  }
];

// UPDATE product
export const updateProduct = [
  validateBody(UpdateProductSchema),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const data: Partial<NewProduct> = req.body;

    try {
      await db.update(products).set(data).where(eq(products.id, id));

      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      if (result.length === 0)
        return res.status(404).json({ message: "Product not found" });

      res.json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to update product" });
    }
  }
];

// DELETE product
export async function deleteProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    await db.delete(products).where(eq(products.id, id));
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
}

// SEARCH products
export const searchProducts = [
  validateQuery(SearchProductSchema),
  async (req: Request, res: Response) => {
    const { q, category, minPrice, maxPrice } = req.query as {
      q?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    };

    try {
      const conditions = [];
      if (q) conditions.push(like(products.name, `%${q}%`));
      if (category) conditions.push(eq(products.category, category));
      if (minPrice) conditions.push(gte(products.price, minPrice));
      if (maxPrice) conditions.push(lte(products.price, maxPrice));

      let query = db.select().from(products);

      if (conditions.length > 0) {
        if (conditions.length === 1) {
          query.where(conditions[0]);
        } else {
          // @ts-ignore
          query.where(and(...conditions));
        }
      }

      const result = await query;
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Search failed" });
    }
  }
];
