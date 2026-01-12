import { defineRelations } from "drizzle-orm";
import { users } from "./user";
import { categories } from "./category";
import { products } from "./product";

export const relations = defineRelations(
  { users, categories, products },
  (r) => ({
    users: {
      // Futuras relaciones si se agregan tablas como orders, reviews, etc.
    },
    categories: {
      products: r.many.products({
        from: r.categories.id,
        to: r.products.categoryId,
      }),
    },
    products: {
      category: r.one.categories({
        from: r.products.categoryId,
        to: r.categories.id,
      }),
    },
  })
);
