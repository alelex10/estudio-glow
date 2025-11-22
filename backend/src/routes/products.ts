// src/routes/products.ts
// CRUD routes for Product entity (admin only)

import { Router } from "express";
import type { Request, Response } from "express";
import { eq, like, and } from "drizzle-orm";
import { db } from "../db";
import { products } from "../models/product";
import type { Product, NewProduct } from "../models/product";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// Apply authentication and admin check to all routes in this router
router.use(authenticate, requireAdmin);

// GET /admin/products - list all products
router.get("/products", async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(products);
    if(result.length === 0)
      return res.status(404).json({ message: "No products are available" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST /admin/products - create a new product
router.post("/products", async (req: Request, res: Response) => {
  const data: NewProduct = req.body;
  try {
    const [result] = await db.insert(products).values(data);
    const insertedId = result.insertId;
    // Fetch the created product to return it
    const created = await db
      .select()
      .from(products)
      .where(eq(products.id, insertedId));
    res.status(201).json(created[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create product" });
  }
});

// GET /admin/products/:id - get a single product
router.get("/products/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const result = await db.select().from(products).where(eq(products.id, id));
    if (result.length === 0)
      return res.status(404).json({ message: "Product not found" });
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// PUT /admin/products/:id - update a product
router.put("/products/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data: Partial<NewProduct> = req.body;
  try {
    await db.update(products).set(data).where(eq(products.id, id));

    // Fetch updated
    const result = await db.select().from(products).where(eq(products.id, id));
    if (result.length === 0)
      return res.status(404).json({ message: "Product not found" });
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to update product" });
  }
});

// DELETE /admin/products/:id - delete a product
router.delete("/products/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await db.delete(products).where(eq(products.id, id));
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// GET /admin/search?q=term&category=cat - real‑time search
router.get("/search", async (req: Request, res: Response) => {
  const { q, category } = req.query as { q?: string; category?: string };
  try {
    const conditions = [];
    if (q) conditions.push(like(products.name, `%${q}%`));
    if (category) conditions.push(eq(products.category, category));

    let query = db.select().from(products);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        query.where(conditions[0]);
      } else {
        // @ts-ignore - and() accepts variadic args
        query.where(and(...conditions));
      }
    }

    const result = await query;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
