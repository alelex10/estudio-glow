import type { Request, Response } from "express";
import { eq, like, and, gte, lte, desc, asc, count, lt } from "drizzle-orm";
import { products } from "../models/product";
import { categories } from "../models/category";
import type { NewProduct, Product } from "../models/product";
import { validateBody, validateQuery } from "../middleware/validation";
import {
  UpdateProductSchema,
  SearchProductSchema,
  FilterProductsSchema,
  type GetNewProducts,
  ProductWithCategoryResponseSchema,
} from "../schemas/product";
import { ImageUploadService } from "../services/imageUploadService";
import { PaginationHelper, type PaginatedResponse } from "../types/pagination";
import { ResponseSchema } from "../schemas/response";
import { IdSchema } from "../schemas/id";
import { PaginationProductQuerySchema } from "../schemas/product";
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError, ValidationError } from "../errors";
import { db } from "../db";
import { BadRequestError } from "../errors/bad-request-error";
import { checkCategoryExists } from "./category";

// GET products con paginación
export const listProductsPaginated = [
  async (req: Request, res: Response) => {
    try {
      const validatedQuery = PaginationProductQuerySchema.parse(req.query);
      const { page, limit, sortBy, sortOrder } = validatedQuery;

      const offset = PaginationHelper.calculateOffset(page, limit);

      const totalResult = await db.select({ total: count() }).from(products);

      const total = totalResult[0]?.total || 0;

      const dbResult = await db.query.products.findMany({
        with: {
          category: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        limit,
        offset,
      });

      const paginationMetadata = PaginationHelper.calculateMetadata(
        page,
        limit,
        total
      );

      const response: PaginatedResponse<(typeof dbResult)[0]> = {
        data: dbResult,
        pagination: paginationMetadata,
      };

      res.json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch paginated products" });
    }
  },
];
// GET product by ID
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = IdSchema.parse(req.params.id);

  const result = await db.query.products.findFirst({
    with: {
      category: true,
    },
    where: {
      id: id,
    },
  });

  if (!result) {
    throw new NotFoundError("Producto no encontrado");
  }

  res.json(
    ResponseSchema.parse({
      data: ProductWithCategoryResponseSchema.parse(result),
      message: "Success",
    })
  );
});

export const getNewProducts = [
  async (req: Request, res: Response) => {
    const limit = 8;
    const dbResult = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit);

    const result: GetNewProducts = dbResult;

    res.json(ResponseSchema.parse({ data: result, message: "Success" }));
  },
];

// CREATE product
export const createProduct = [
  async (req: Request, res: Response) => {
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

    res.status(201).json(
      ResponseSchema.parse({
        data: created[0],
        message: "Product created successfully",
      })
    );
  },
];

// UPDATE product
export const updateProduct = [
  async (req: Request, res: Response) => {
    const id = IdSchema.parse(req.params.id);
    const data = UpdateProductSchema.parse(req.body);

    const product = await checkProductIdExists(id);
    let imageUrl = product?.imageUrl;

    if (req.file) {
      const uploadResult = await ImageUploadService.updateProductImage(
        req.file.buffer,
        id,
        product?.imageUrl || undefined
      );
      imageUrl = uploadResult.secure_url;
    }

    if (
      data.categoryId !== undefined &&
      data.categoryId !== product.categoryId
    ) {
      await checkCategoryExists(data.categoryId);
    }

    const productoData = {
      name: data.name || product.name,
      description: data.description || product.description,
      price: data.price !== undefined ? data.price : product.price,
      stock: data.stock !== undefined ? data.stock : product.stock,
      categoryId:
        data.categoryId !== undefined ? data.categoryId : product.categoryId,
      imageUrl: imageUrl || product.imageUrl,
    };

    await db.update(products).set(productoData).where(eq(products.id, id));

    const result = await db.select().from(products).where(eq(products.id, id));

    res.json(result[0]);
  },
];

// DELETE product
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      throw new ValidationError("ID de producto inválido");
    }

    // Eliminar imagen de Cloudinary usando el servicio
    await ImageUploadService.deleteImage(`products/${id}`);

    await db.delete(products).where(eq(products.id, id));
    res.json({ message: "Producto eliminado" });
  }
);

// SEARCH products
export const searchProducts = [
  validateQuery(SearchProductSchema),
  async (req: Request, res: Response) => {
    const { q, categoryId, minPrice, maxPrice } = req.query as {
      q?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
    };

    try {
      const conditions = [];
      if (q) conditions.push(like(products.name, `%${q}%`));
      if (categoryId) conditions.push(eq(products.categoryId, categoryId));
      if (minPrice) conditions.push(gte(products.price, minPrice));
      if (maxPrice) conditions.push(lte(products.price, maxPrice));

      let query = db.select().from(products);

      if (conditions.length > 0) {
        if (conditions.length === 1) {
          query.where(conditions[0]).limit(10);
        } else {
          // @ts-ignore
          query.where(and(...conditions)).limit(10);
        }
      }

      const result = await query;
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Search failed" });
    }
  },
];

// FILTER products
export const filterProducts = [
  async (req: Request, res: Response) => {
    try {
      // Validar directamente con el schema - sin middleware
      const validatedQuery = FilterProductsSchema.parse(req.query);
      const {
        page,
        limit,
        sortBy = "createdAt",
        sortOrder = "desc",
        categoryId,
      } = validatedQuery;

      // Calcular offset
      const offset = PaginationHelper.calculateOffset(page, limit);

      // Construir condiciones de filtrado
      const conditions = [];
      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId));
      }

      // Obtener total de productos con filtros aplicados
      const totalResult =
        conditions.length > 0
          ? await db
              .select({ total: count() })
              .from(products)
              // @ts-ignore
              .where(and(...conditions))
          : await db.select({ total: count() }).from(products);

      const total = totalResult[0]?.total || 0;

      // Construir y ejecutar query con filtros, ordenamiento y paginación
      let result: Product[] = [];

      if (conditions.length > 0) {
        // Con filtros
        if (sortBy) {
          const orderFn = sortOrder === "asc" ? asc : desc;
          result = await db
            .select()
            .from(products)
            .where(and(...conditions))
            .orderBy(orderFn(products[sortBy]))
            .limit(limit)
            .offset(offset);
        } else {
          result = await db
            .select()
            .from(products)
            .where(and(...conditions))
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);
        }
      } else {
        // Sin filtros
        if (sortBy) {
          const orderFn = sortOrder === "asc" ? asc : desc;
          result = await db
            .select()
            .from(products)
            .orderBy(orderFn(products[sortBy]))
            .limit(limit)
            .offset(offset);
        } else {
          result = await db
            .select()
            .from(products)
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);
        }
      }

      // Calcular metadatos de paginación
      const paginationMetadata = PaginationHelper.calculateMetadata(
        page,
        limit,
        total
      );

      // Construir respuesta paginada
      const response: PaginatedResponse<Product> = {
        data: result,
        pagination: paginationMetadata,
      };

      res.json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to filter products" });
    }
  },
];

export const checkProductNameExists = async (name: string) => {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.name, name));
  return result[0];
};

export const checkProductIdExists = async (id: string) => {
  const result = await db.query.products.findFirst({
    with: {
      category: true,
    },
    where: {
      id,
    },
  });
  if (!result) {
    throw new NotFoundError("Producto no encontrado");
  }
  return result;
};
