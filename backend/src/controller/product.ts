import type { Request, Response } from "express";
import { eq, like, and, gte, lte, desc, asc, count } from "drizzle-orm";
import { products } from "../models/product";
import { categories } from "../models/category";
import type { NewProduct, Product } from "../models/product";
import { validateBody, validateQuery } from "../middleware/validation";
import {
  CreateProductSchema,
  UpdateProductSchema,
  SearchProductSchema,
  FilterProductsSchema,
  type ProductResponse,
  type GetNewProducts,
  ProductWithCategoryResponseSchema,
} from "../schemas/product";
import cloudinaryConfig from "../cloudfile";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { PaginationHelper, type PaginatedResponse } from "../types/pagination";
import { ResponseSchema } from "../schemas/response";
import { IdSchema } from "../schemas/id";
import { PaginationProductQuerySchema } from "../schemas/product";
import { CLOUDINARY } from "../constants/const";
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError, ValidationError } from "../errors";
import { drizzle } from "drizzle-orm/mysql2";
import { db } from "../db";
import { relations } from "../models/relations";

cloudinary.config(cloudinaryConfig);

// GET products con paginación
export const listProductsPaginated = [
  async (req: Request, res: Response) => {
    try {
      // Validar directamente con el schema - sin middleware
      const validatedQuery = PaginationProductQuerySchema.parse(req.query);
      const {
        page,
        limit,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = validatedQuery;

      console.log(validatedQuery);

      // Calcular offset
      const offset = PaginationHelper.calculateOffset(page, limit);

      // Obtener total de productos
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

      console.log(dbResult);

      // Calcular metadatos de paginación
      const paginationMetadata = PaginationHelper.calculateMetadata(
        page,
        limit,
        total
      );

      // Construir respuesta paginada
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

  const result = await db
    .select()
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundError("Producto no encontrado");
  }

  const product = {
    ...result[0]?.product,
    category: result[0]?.category,
    createdAt: result[0]?.product.createdAt.toISOString(),
    updatedAt: result[0]?.product.updatedAt.toISOString(),
  };

  res.json(
    ResponseSchema.parse({
      data: ProductWithCategoryResponseSchema.parse(product),
      message: "Success",
    })
  );
});

export const getNewProducts = [
  async (req: Request, res: Response) => {
    try {
      const limit = 8;
      const dbResult = await db
        .select()
        .from(products)
        .orderBy(desc(products.createdAt))
        .limit(limit);

      const result: GetNewProducts = dbResult;

      res.json(ResponseSchema.parse({ data: result, message: "Success" }));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch new products" });
    }
  },
];

// CREATE product
export const createProduct = [
  validateBody(CreateProductSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, description, price, stock, categoryId } = req.body;

      // Validate that category exists
      const categoryExists = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId));

      if (categoryExists.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }

      const exists = await db
        .select()
        .from(products)
        .where(eq(products.name, name));

      if (exists.length > 0)
        return res.status(400).json({
          message:
            "El producto de nombre " +
            name +
            " ya existe solo se le puede subir o bajar el stock",
        });

      const id = crypto.randomUUID();

      if (!req.file) {
        return res.status(400).json({ message: "Imagen requerida" });
      }
      // Subir imagen a Cloudinary desde buffer
      const cloudinaryResult: UploadApiResponse = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "products",
                public_id: `${id}`,
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else if (result) resolve(result);
                else reject(new Error("Upload failed: No result returned"));
              }
            )
            .end(req.file!.buffer);
        }
      );

      const data: NewProduct = {
        id,
        name,
        description,
        price,
        stock,
        categoryId,
        imageUrl: cloudinaryResult.secure_url,
      };

      await db.insert(products).values(data);
      const created = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      res.status(201).json(
        ResponseSchema.parse({
          data: created[0],
          message: "Product created successfully",
        })
      );
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create product" });
    }
  },
];

// UPDATE product
export const updateProduct = [
  validateBody(UpdateProductSchema),
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const data: Partial<NewProduct> = req.body;

    try {
      const existing: Product[] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      if (existing.length === 0) {
        return res.status(404).json({ message: "Product already exists" });
      }
      const product = existing[0];
      let imageUrl = product?.imageUrl;

      if (req.file) {
        // Eliminar imagen anterior de Cloudinary si existe
        if (product?.imageUrl) {
          const fileName = product.imageUrl.split("/").pop();
          if (fileName) {
            const publicId = fileName.split(".")[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
          }
        }

        // Subir nueva imagen desde buffer
        const result = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "products",
                  public_id: `product_${Date.now()}`,
                  resource_type: "image",
                },
                (error, result) => {
                  if (error) reject(error);
                  else if (result) resolve(result);
                  else reject(new Error("Upload failed: No result returned"));
                }
              )
              .end(req.file!.buffer);
          }
        );
        imageUrl = result.secure_url;
      }
      // Validate categoryId if provided
      if (data.categoryId !== undefined) {
        const categoryExists = await db
          .select()
          .from(categories)
          .where(eq(categories.id, data.categoryId));

        if (categoryExists.length === 0) {
          return res.status(404).json({ message: "Category not found" });
        }
      }

      const productoData = {
        name: data.name || existing[0]?.name,
        description: data.description || existing[0]?.description,
        price: data.price !== undefined ? data.price : existing[0]?.price,
        stock: data.stock !== undefined ? data.stock : existing[0]?.stock,
        categoryId:
          data.categoryId !== undefined
            ? data.categoryId
            : existing[0]?.categoryId,
        imageUrl: imageUrl || existing[0]?.imageUrl,
      };

      await db.update(products).set(productoData).where(eq(products.id, id));

      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      res.json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to update product" });
    }
  },
];

// DELETE product
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      throw new ValidationError("ID de producto inválido");
    }

    cloudinary.uploader.destroy(`${CLOUDINARY.FOLDER.PRODUCTS}/${id}`);

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
