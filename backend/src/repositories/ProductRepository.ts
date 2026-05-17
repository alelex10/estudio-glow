import { db } from "../db";
import { products } from "../models/product";
import { categories } from "../models/category";
import {
  eq,
  ilike,
  like,
  and,
  gte,
  lte,
  gt,
  desc,
  asc,
  count,
} from "drizzle-orm";
import type { Product, NewProduct } from "../models/product";

export type { Product, NewProduct };

// Shape returned by queries that join category
export type ProductWithCategory = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
};

type FilterCondition =
  | ReturnType<typeof eq>
  | ReturnType<typeof and>
  | ReturnType<typeof ilike>
  | ReturnType<typeof gt>
  | ReturnType<typeof lte>;

export type ProductFilterOpts = {
  q?: string;
  category?: string;
  categoryId?: string;
  stock?: "low" | "out" | "ok";
};

export type ProductPaginatedOpts = ProductFilterOpts & {
  sortBy: "name" | "price" | "createdAt" | "stock";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
};

export type ProductSearchOpts = {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export class ProductRepository {
  // ---------------------------------------------------------------------------
  // Internal query helpers
  // ---------------------------------------------------------------------------

  private static buildJoinedSelect() {
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

  /**
   * Builds WHERE conditions for product queries.
   *
   * FIX 4.3 (SRP): category-by-name resolution no longer issues a separate
   * pre-query against `categories`. It now produces an `ilike(categories.name, ...)`
   * condition — callers MUST join `categories` when using the `category` filter
   * (both `countFiltered` and `findPaginated` already do so via `buildJoinedSelect`).
   * If you add a caller that selects from `products` only, pass `categoryId` instead.
   *
   * NOTE: Agent B owns this method. Agent A owns the `search` method below.
   */
  private static buildFilters(opts: ProductFilterOpts): FilterCondition[] {
    const conditions: FilterCondition[] = [];

    if (opts.q) {
      conditions.push(ilike(products.name, `%${opts.q}%`));
    }

    if (opts.categoryId) {
      conditions.push(eq(products.categoryId, opts.categoryId));
    } else if (opts.category) {
      // Resolve category name via the already-joined `categories` table —
      // no extra round-trip to the database.
      conditions.push(ilike(categories.name, `%${opts.category}%`));
    }

    if (opts.stock) {
      switch (opts.stock) {
        case "low":
          conditions.push(
            and(gt(products.stock, 0), lte(products.stock, 10)) as ReturnType<
              typeof and
            >,
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

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  static async findById(id: string): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  }

  static async findByIdWithCategory(
    id: string,
  ): Promise<ProductWithCategory | undefined> {
    const result = await ProductRepository.buildJoinedSelect()
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  }

  static async findByName(name: string): Promise<Product | undefined> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.name, name));
    return result[0];
  }

  /** Returns the 8 most recently created products (plain rows, no join). */
  static async findNewest(limit = 8): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  static async countFiltered(opts: ProductFilterOpts): Promise<number> {
    const conditions = ProductRepository.buildFilters(opts);
    // Join categories so that ilike(categories.name, ...) conditions work
    // when the caller passes `category` (name) instead of `categoryId`.
    const baseQuery = db
      .select({ total: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
    const totalResult =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery;
    return totalResult[0]?.total ?? 0;
  }

  static async findPaginated(
    opts: ProductPaginatedOpts,
  ): Promise<ProductWithCategory[]> {
    const conditions = ProductRepository.buildFilters(opts);
    let query = ProductRepository.buildJoinedSelect();

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const orderFn = opts.sortOrder === "desc" ? desc : asc;
    return query
      .orderBy(orderFn(products[opts.sortBy]))
      .limit(opts.limit)
      .offset(opts.offset);
  }

  /** Simple search without pagination (max 10 results). */
  static async search(opts: ProductSearchOpts): Promise<Product[]> {
    const conditions = [];
    if (opts.q) conditions.push(like(products.name, `%${opts.q}%`));
    if (opts.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
    if (opts.minPrice) conditions.push(gte(products.price, opts.minPrice));
    if (opts.maxPrice) conditions.push(lte(products.price, opts.maxPrice));

    return db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(10);
  }

  static async create(data: NewProduct): Promise<Product> {
    await db.insert(products).values(data);
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, data.id!));
    if (!result[0]) throw new Error("Failed to create product");
    return result[0];
  }

  static async update(
    id: string,
    data: Partial<NewProduct>,
  ): Promise<Product | undefined> {
    await db.update(products).set(data).where(eq(products.id, id));
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return result[0];
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }
}
