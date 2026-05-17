export { users } from './user';
export type { User, NewUser } from './user';

export { categories } from './category';
export type { Category, NewCategory } from './category';

export { products } from './product';
export type { Product, NewProduct } from './product';

export { favorites } from './favorite';
export type { Favorite, NewFavorite } from './favorite';

export { carts, cartItems } from './cart';
export type { Cart, NewCart, CartItem, NewCartItem } from './cart';

export { orders, orderItems } from './order';
export type { Order, NewOrder, OrderItem, NewOrderItem } from './order';

export { webhookEvents } from './webhook-event';
export type { WebhookEvent, NewWebhookEvent } from './webhook-event';

export { authTokens } from './auth-token';
export type { AuthToken, NewAuthToken } from './auth-token';

export { idempotencyKeys } from './idempotency-key';
export type { IdempotencyKey, NewIdempotencyKey } from './idempotency-key';

// Drizzle ORM relation definitions (used by `with` queries)
import { relations } from 'drizzle-orm';
import { users as usersTable } from './user';
import { authTokens as authTokensTable } from './auth-token';

export const usersRelations = relations(usersTable, ({ many }) => ({
  authTokens: many(authTokensTable),
}));

export const authTokensRelations = relations(authTokensTable, ({ one }) => ({
  user: one(usersTable, { fields: [authTokensTable.user_id], references: [usersTable.id] }),
}));
