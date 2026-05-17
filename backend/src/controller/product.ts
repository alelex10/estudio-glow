import type { Request, Response } from "express";
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
import { PaginationHelper, type PaginatedResponse } from "../types/pagination";
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError } from "../errors";
import { BadRequestError } from "../errors/bad-request-error";
import { checkCategoryExists } from "./category";
import type { GetNewProducts } from "../schemas/product";
import { checkProductExists, successResponse } from "../utils/crud-helpers";
import { ProductRepository } from "../repositories/ProductRepository";
import type { NewProduct } from "../models/product";

// GET products con paginación y filtros combinables
export const listProductsPaginated = [
  validateQuery(PaginationProductQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = PaginationProductQuerySchema.parse(req.query);
    const { page, limit, sortBy, sortOrder, q, category, categoryId, stock } =
      validatedQuery;

    const offset = PaginationHelper.calculateOffset(page, limit);

    const [total, data] = await Promise.all([
      ProductRepository.countFiltered({ q, category, categoryId, stock }),
      ProductRepository.findPaginated({
        q,
        category,
        categoryId,
        stock,
        sortBy,
        sortOrder,
        limit,
        offset,
      }),
    ]);

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

    const result = await ProductRepository.findByIdWithCategory(id);

    if (!result) {
      throw new NotFoundError("Producto no encontrado");
    }

    res.json(
      successResponse(ProductWithCategoryResponseSchema.parse(result), "Success"),
    );
  }),
];

export const getNewProducts = asyncHandler(async (_req: Request, res: Response) => {
  const dbResult = await ProductRepository.findNewest(8);
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
      id,
    );

    const data: NewProduct = {
      ...req.body,
      id,
      imageUrl: uploadResult.secure_url,
    };

    const created = await ProductRepository.create(data);

    res.status(201).json(successResponse(created, "Product created successfully"));
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
        product.imageUrl || undefined,
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

    const result = await ProductRepository.update(id, productoData);

    res.json(successResponse(result, "Product updated successfully"));
  }),
];

// DELETE product
export const deleteProduct = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    await checkProductExists(id);

    await ImageUploadService.deleteImage(`products/${id}`);

    await ProductRepository.delete(id);
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

    const result = await ProductRepository.search({ q, categoryId, minPrice, maxPrice });
    res.json(successResponse(result, "Products found"));
  }),
];

export const checkProductNameExists = async (name: string) => {
  return ProductRepository.findByName(name);
};
