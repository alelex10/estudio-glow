import { db } from "../db";
import { orders } from "../models/order";
import { eq, lt, and, ne } from "drizzle-orm";
import { OrderService } from "./OrderService";

export function startCronJobs() {
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredOrders = await db.select().from(orders)
        .where(
          and(
             lt(orders.expiresAt, now),
             ne(orders.status, "PAID"),
             ne(orders.status, "CANCELLED"),
             ne(orders.status, "EXPIRED")
          )
        );
        
      for (const order of expiredOrders) {
         await OrderService.cancelOrder(order.id);
         await db.update(orders).set({ status: "EXPIRED" }).where(eq(orders.id, order.id));
      }
    } catch (err) {
      console.error("Cronjob error:", err);
    }
  }, 60000); // 1 minute
}
