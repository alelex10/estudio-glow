import { db } from "../db";
import { webhookEvents } from "../models/webhook-event";
import { logger } from "../lib/logger";

export class WebhookEventService {
  /**
   * Attempt to record a webhook event identified by (paymentId, action).
   * Uses INSERT ... ON CONFLICT DO NOTHING to guarantee at-most-once
   * processing per unique (payment, action) pair, even under concurrent
   * retries from MP. This allows the same payment_id to be processed once
   * per lifecycle transition (e.g. approved → refunded).
   *
   * @returns { duplicate: true } when the event was already processed.
   * @returns { duplicate: false } when this is the first occurrence.
   */
  static async recordOrSkip(
    paymentId: string,
    action: string,
  ): Promise<{ duplicate: boolean }> {
    const result = await db
      .insert(webhookEvents)
      .values({ paymentId, action, type: action })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });

    if (result.length === 0) {
      logger.warn({ paymentId, action }, "webhook.duplicate_event_skipped");
      return { duplicate: true };
    }

    return { duplicate: false };
  }
}
