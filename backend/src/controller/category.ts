import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../models/category";
import type { Category, NewCategory } from "../models/category";
import { validateBody } from "../middleware/validation";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../schemas/category";
import { products } from "../models/product";

// GET all categories
export const listCategories = async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(categories);
    res.json({ categories: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// GET category by ID
export const getCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (result.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch category" });
  }
};

// CREATE category
export const createCategory = [
  validateBody(CreateCategorySchema),
  async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      // Check if category with same name already exists
      const exists = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name));

      if (exists.length > 0) {
        return res
          .status(409)
          .json({ message: "Category with this name already exists" });
      }

      const data: NewCategory = {
        name,
        description,
      };

      const [result] = await db.insert(categories).values(data);

      const created = await db
        .select()
        .from(categories)
        .where(eq(categories.id, result.insertId));

      res.status(201).json(created[0]);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create category" });
    }
  },
];

// UPDATE category
export const updateCategory = [
  validateBody(UpdateCategorySchema),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    try {
      // Check if category exists
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

      if (existing.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }

      const { name, description } = req.body;

      // If updating name, check if new name already exists
      if (name && name !== existing[0]!.name) {
        const nameExists = await db
          .select()
          .from(categories)
          .where(eq(categories.name, name));

        if (nameExists.length > 0) {
          return res
            .status(409)
            .json({ message: "Category with this name already exists" });
        }
      }

      const categoryData: Partial<NewCategory> = {
        name: name || existing[0]!.name,
        description:
          description !== undefined ? description : existing[0]!.description,
      };

      await db
        .update(categories)
        .set(categoryData)
        .where(eq(categories.id, id));

      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

      res.json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to update category" });
    }
  },
];

// DELETE category
export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has associated products
    const associatedProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id));

    if (associatedProducts.length > 0) {
      return res.status(409).json({
        message: "Cannot delete category with associated products",
        productsCount: associatedProducts.length,
      });
    }

    await db.delete(categories).where(eq(categories.id, id));

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
