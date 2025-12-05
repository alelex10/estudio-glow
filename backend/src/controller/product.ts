import type { Request, Response } from "express";
import { eq, like, and, gte, lte, Name } from "drizzle-orm";
import { db } from "../db";
import { products } from "../models/product";
import type { NewProduct, Product } from "../models/product";
import { validateBody, validateQuery } from "../middleware/validation";
import { CreateProductSchema, UpdateProductSchema, SearchProductSchema } from "../schemas/product";
import cloudinaryConfig from "../cloudfile";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { ListFormat } from "typescript";

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
      const {name, description, price, stock, category} = req.body;
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
      
      if(!req.file){
        return res.status(400).json({ message: "Imagen requerida" });
      }
      // Subir imagen a Cloudinary desde buffer
      const cloudinaryResult: UploadApiResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
              {
                  folder: 'products',
                  public_id: `product_${Date.now()}`,
                  resource_type: 'image'
              },
              (error, result) => {
                  if (error) reject(error);
                  else if (result) resolve(result);
                  else reject(new Error('Upload failed: No result returned'));
              }
          ).end(req.file!.buffer);
      });

      const data = {
        name,
        description,
        price,
        stock,
        category,
        imageUrl: cloudinaryResult.secure_url
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
      const existing : Product[]= await db
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
                    const fileName = product.imageUrl.split('/').pop();
                    if (fileName) {
                        const publicId = fileName.split('.')[0];
                        await cloudinary.uploader.destroy(`products/${publicId}`);
                    }
                }
                
                // Subir nueva imagen desde buffer
                const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'products',
                            public_id: `product_${Date.now()}`,
                            resource_type: 'image'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else if (result) resolve(result);
                            else reject(new Error('Upload failed: No result returned'));
                        }
                    ).end(req.file!.buffer);
                });
                imageUrl = result.secure_url;
            }
      const productoData ={
        name: data.name || existing[0]?.name,
        description: data.description || existing[0]?.description,
        price: data.price !== undefined ? data.price : existing[0]?.price,
        stock: data.stock !== undefined ? data.stock : existing[0]?.stock,
        category: data.category !== undefined ? data.category : existing[0]?.category,
        imageUrl: imageUrl || existing[0]?.imageUrl
      }
      
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
