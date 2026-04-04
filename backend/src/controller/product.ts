import type { Request, Response } from "express";
import { eq, like, ilike, and, gte, lte, desc, asc, count, gt } from "drizzle-orm";
import { products, categories } from "../models/relations";
import type { NewProduct } from "../models/product";
import { validateBody, validateQuery, validateParams } from "../middleware/validation";
import {
  CreateProductSchema,
  UpdateProductSchema,
  SearchProductSchema,
  PaginationProductQuerySchema,
  ProductWithCategoryResponseSchema,
} from "../schemas/product";
import { ParamsIdSchema } from "../schemas/params";
import { ImageUploadService } from "../services/imageUploadService";
import { PaginationHelper } from "../types/pagination";
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError } from "../errors";
import { db } from "../db";
import { BadRequestError } from "../errors/bad-request-error";
import { checkCategoryExists } from "./category";
import type { GetNewProducts } from "../schemas/product";
import { 
  checkProductExists, 
  successResponse,
  type PaginatedResponse
} from "../utils/crud-helpers";

type FilterCondition = ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof ilike> | ReturnType<typeof gt> | ReturnType<typeof lte>;

async function buildProductFilters(
  q?: string,
  category?: string,
  categoryId?: string,
  stock?: "low" | "out" | "ok"
): Promise<FilterCondition[]> {
  const conditions: FilterCondition[] = [];

  if (q) {
    conditions.push(ilike(products.name, `%${q}%`));
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  } else if (category) {
    const categoryResult = await db
      .select({ id: categories.id })
      .from(categories)
      .where(ilike(categories.name, `%${category}%`))
      .limit(1);

    if (categoryResult.length > 0) {
      conditions.push(eq(products.categoryId, categoryResult[0]!.id));
    } else {
      // Si no se encuentra la categoría, forzar resultado vacío
      conditions.push(eq(products.categoryId, "no-match"));
    }
  }

  if (stock) {
    switch (stock) {
      case "low":
        conditions.push(
          and(gt(products.stock, 0), lte(products.stock, 10)) as ReturnType<typeof and>
        );
        break;
      case "out":
        conditions.push(eq(products.stock, 0));
        break;
      case "ok":
        conditions.push(gt(products.stock, 10));
        break;
    }
  }

  return conditions;
}

function buildProductQueryWithJoin() {
  return db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      categoryId: products.categoryId,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));
}

async function countProducts(conditions: FilterCondition[]): Promise<number> {
  const totalResult =
    conditions.length > 0
      ? await db.select({ total: count() }).from(products).where(and(...conditions))
      : await db.select({ total: count() }).from(products);

  return totalResult[0]?.total || 0;
}

async function executePaginatedQuery(
  baseQuery: ReturnType<typeof buildProductQueryWithJoin>,
  conditions: FilterCondition[],
  sortBy: "name" | "price" | "createdAt" | "stock",
  sortOrder: "asc" | "desc",
  limit: number,
  offset: number
) {
  let query = baseQuery;

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const orderFn = sortOrder === "desc" ? desc : asc;

  return await query.orderBy(orderFn(products[sortBy])).limit(limit).offset(offset);
}

// GET products con paginación y filtros combinables
export const listProductsPaginated = [
  validateQuery(PaginationProductQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = PaginationProductQuerySchema.parse(req.query);
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      q,
      category,
      categoryId,
      stock,
    } = validatedQuery;

    const offset = PaginationHelper.calculateOffset(page, limit);

    const conditions = await buildProductFilters(q, category, categoryId, stock);
    const total = await countProducts(conditions);
    const baseQuery = buildProductQueryWithJoin();
    const data = await executePaginatedQuery(
      baseQuery,
      conditions,
      sortBy,
      sortOrder,
      limit,
      offset
    );

    const paginationMetadata = PaginationHelper.calculateMetadata(page, limit, total);

    const response: PaginatedResponse<(typeof data)[0]> = {
      data,
      pagination: paginationMetadata,
    };

    res.json(response);
  }),
];
// GET product by ID
export const getProduct = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundError("Producto no encontrado");
    }

    res.json(
      successResponse(
        ProductWithCategoryResponseSchema.parse(result[0]),
        "Success"
      )
    );
  }),
];

export const getNewProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = 8;
  const dbResult = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(limit);

  res.json(successResponse(dbResult as GetNewProducts, "Success"));
});

// CREATE product
export const createProduct = [
  validateBody(CreateProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, price, stock, categoryId } = req.body;

    await checkCategoryExists(categoryId);

    if (await checkProductNameExists(name)) {
      throw new BadRequestError("El producto con ese nombre ya existe");
    }

    const id = crypto.randomUUID();

    if (!req.file) {
      throw new BadRequestError("Imagen requerida");
    }

    const uploadResult = await ImageUploadService.uploadProductImage(
      req.file.buffer,
      id
    );

    const data: NewProduct = {
      ...req.body,
      id,
      imageUrl: uploadResult.secure_url,
    };

    await db.insert(products).values(data);
    const created = await db.select().from(products).where(eq(products.id, id));

    res.status(201).json(successResponse(created[0], "Product created successfully"));
  }),
];

// UPDATE product
export const updateProduct = [
  validateParams(ParamsIdSchema),
  validateBody(UpdateProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = req.body;

    const product = await checkProductExists(id);
    let imageUrl = product.imageUrl;

    if (req.file) {
      const uploadResult = await ImageUploadService.updateProductImage(
        req.file.buffer,
        id,
        product.imageUrl || undefined
      );
      imageUrl = uploadResult.secure_url;
    }

    if (data.categoryId !== undefined && data.categoryId !== product.categoryId) {
      await checkCategoryExists(data.categoryId);
    }

    const productoData = {
      name: data.name ?? product.name,
      description: data.description ?? product.description,
      price: data.price ?? product.price,
      stock: data.stock ?? product.stock,
      categoryId: data.categoryId ?? product.categoryId,
      imageUrl: imageUrl ?? product.imageUrl,
    };

    await db.update(products).set(productoData).where(eq(products.id, id));

    const result = await db.select().from(products).where(eq(products.id, id));

    res.json(successResponse(result[0], "Product updated successfully"));
  }),
];

// DELETE product
export const deleteProduct = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    // Verificar que el producto existe antes de eliminar
    await checkProductExists(id);

    // Eliminar imagen de Cloudinary usando el servicio
    await ImageUploadService.deleteImage(`products/${id}`);

    await db.delete(products).where(eq(products.id, id));
    res.json(successResponse(null, "Producto eliminado"));
  }),
];

// SEARCH products (búsqueda simple sin paginación, máx 10 resultados)
export const searchProducts = [
  validateQuery(SearchProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, categoryId, minPrice, maxPrice } = req.query as {
      q?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
    };

    const conditions = [];
    if (q) conditions.push(like(products.name, `%${q}%`));
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (minPrice) conditions.push(gte(products.price, minPrice));
    if (maxPrice) conditions.push(lte(products.price, maxPrice));

    let query = db.select().from(products).limit(10);

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        query = (query as any).where(conditions[0]);
      } else {
        query = (query as any).where(and(...conditions));
      }
    }

    const result = await query;
    res.json(successResponse(result, "Products found"));
  }),
];

export const checkProductNameExists = async (name: string) => {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.name, name));
  return result[0];
};
