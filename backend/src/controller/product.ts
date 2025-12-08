import type { Request, Response } from "express";
import {
  eq,
  like,
  and,
  gte,
  lte,
  Name,
  desc,
  asc,
  sql,
  count,
} from "drizzle-orm";
import { db } from "../db";
import { products } from "../models/product";
import { categories } from "../models/category";
import type { NewProduct, Product } from "../models/product";
import { validateBody, validateQuery } from "../middleware/validation";
import {
  CreateProductSchema,
  UpdateProductSchema,
  SearchProductSchema,
  PaginationQuerySchema,
} from "../schemas/product";
import cloudinaryConfig from "../cloudfile";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { ListFormat } from "typescript";
import { PaginationHelper, type PaginatedResponse } from "../types/pagination";

cloudinary.config(cloudinaryConfig);

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

// GET products con paginación
export const listProductsPaginated = [
  validateQuery(PaginationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      // Extraer parámetros validados del query
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const sortBy = req.query.sortBy as
        | "name"
        | "price"
        | "createdAt"
        | "stock"
        | undefined;
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      // Calcular offset
      const offset = PaginationHelper.calculateOffset(page, limit);

      // Obtener total de productos
      const totalResult = await db.select({ total: count() }).from(products);

      const total = totalResult[0]?.total || 0;

      // Construir y ejecutar query con ordenamiento
      let result: Product[] = [];

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
      res.status(500).json({ message: "Failed to fetch paginated products" });
    }
  },
];

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

      const data = {
        name,
        description,
        price,
        stock,
        categoryId,
        imageUrl: cloudinaryResult.secure_url,
      };

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
  },
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
    const { q, categoryId, minPrice, maxPrice } = req.query as {
      q?: string;
      categoryId?: number;
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
