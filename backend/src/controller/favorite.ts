import type { Request, Response } from "express";
import { db } from "../db";
import { favorites, products } from "../models/relations";
import { eq, and } from "drizzle-orm";
import { asyncHandler } from "../middleware/async-handler";
import { AuthenticationError, ConflictError, NotFoundError, BadRequestError } from "../errors";

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) throw new AuthenticationError("No autenticado");

  const productId = req.params.productId;
  if (!productId) throw new BadRequestError("productId es requerido");

  // Verificar que el producto existe
  const productResult = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId));

  if (productResult.length === 0) {
    throw new NotFoundError("Producto no encontrado");
  }

  // Verificar si ya es favorito
  const existing = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, authUser.id),
        eq(favorites.productId, productId)
      )
    );

  if (existing.length > 0) {
    throw new ConflictError("El producto ya está en favoritos");
  }

  await db.insert(favorites).values({
    userId: authUser.id,
    productId,
  });

  res.status(201).json({ message: "Producto agregado a favoritos" });
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) throw new AuthenticationError("No autenticado");

  const productId = req.params.productId;
  if (!productId) throw new BadRequestError("productId es requerido");

  const result = await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, authUser.id),
        eq(favorites.productId, productId)
      )
    )
    .returning();

  if (result.length === 0) {
    throw new NotFoundError("Favorito no encontrado");
  }

  res.status(200).json({ message: "Producto eliminado de favoritos" });
});

export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) throw new AuthenticationError("No autenticado");

  const result = await db
    .select({
      id: favorites.id,
      createdAt: favorites.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
      },
    })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, authUser.id))
    .orderBy(favorites.createdAt);

  res.status(200).json({ data: result });
});

export const getFavoriteIds = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) throw new AuthenticationError("No autenticado");

  const result = await db
    .select({ productId: favorites.productId })
    .from(favorites)
    .where(eq(favorites.userId, authUser.id));

  const ids = result.map((f) => f.productId);
  res.status(200).json({ data: ids });
});
