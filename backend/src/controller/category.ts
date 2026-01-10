import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../models/category";
import type { Category, NewCategory } from "../models/category";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import {
  CategoryListResponseSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../schemas/category";
import { products } from "../models/product";
import { ResponseSchema } from "../schemas/response";
import { IdSchema } from "../schemas/id";
import { ParamsIdSchema } from "../schemas/params";
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError, ConflictError } from "../errors";

// GET all categories
export const listCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await db.select().from(categories);
    res.json(
      ResponseSchema.parse({
        message: "Categorías obtenidas exitosamente",
        data: CategoryListResponseSchema.parse(result),
      })
    );
  }
);

// GET category by ID
export const getCategory = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (result.length === 0) {
      throw new NotFoundError("Categoría no encontrada");
    }

    res.json(result[0]);
  }),
];

// CREATE category
export const createCategory = [
  validateBody(CreateCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;

    // Check if category with same name already exists
    const exists = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name));

    if (exists.length > 0) {
      throw new ConflictError("Ya existe una categoría con este nombre");
    }

    const id = crypto.randomUUID();
    const data: NewCategory = {
      id,
      name,
      description,
    };

    await db.insert(categories).values({
      ...data,
    });

    const created = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    res.status(201).json(
      ResponseSchema.parse({
        message: "Categoría creada exitosamente",
        data: created[0],
      })
    );
  }),
];

// UPDATE category
export const updateCategory = [
  validateParams(ParamsIdSchema),
  validateBody(UpdateCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (existing.length === 0) {
      throw new NotFoundError("Categoría no encontrada");
    }

    const { name, description } = req.body;

    // If updating name, check if new name already exists
    if (name && name !== existing[0]!.name) {
      const nameExists = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name));

      if (nameExists.length > 0) {
        throw new ConflictError("Ya existe una categoría con este nombre");
      }
    }

    const categoryData: Partial<NewCategory> = {
      name: name || existing[0]!.name,
      description:
        description !== undefined ? description : existing[0]!.description,
    };

    await db.update(categories).set(categoryData).where(eq(categories.id, id));

    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    res.json(result[0]);
  }),
];

// DELETE category
export const deleteCategory = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    // Check if category exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (existing.length === 0) {
      throw new NotFoundError("Categoría no encontrada");
    }

    // Check if category has associated products
    const associatedProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id));

    if (associatedProducts.length > 0) {
      throw new ConflictError(
        `No se puede eliminar la categoría porque tiene ${associatedProducts.length} productos asociados`
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    res.json({ message: "Categoría eliminada exitosamente" });
  }),
];
