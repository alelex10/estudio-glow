import { db } from "../db";
import { authTokens } from "../models/auth-token";
import { sql, lt, and, isNotNull } from "drizzle-orm";
import { OrderService } from "./OrderService";
import { OrderRepository } from "../repositories/OrderRepository";
import { MercadoPagoService } from "./MercadoPagoService";
import { env } from "../config/env";
import { logger } from "../lib/logger";

// Stable 64-bit signed integer used as the Postgres advisory lock key.
// Any random-ish constant works as long as it is the same across instances.
const ORDER_EXPIRY_LOCK_KEY = 4242424242;

// Advisory lock key for the nightly auth_tokens cleanup job.
// Must be unique across all cron jobs in this service.
const AUTH_TOKEN_CLEANUP_LOCK_KEY = 4242424243;

// Advisory lock key for the MercadoPago order reconciliation job (every 5 min).
const MP_RECONCILE_LOCK_KEY = 4242424244;

// Advisory lock key for the nightly webhook_event TTL cleanup job (03:30 UTC).
const WEBHOOK_EVENT_CLEANUP_LOCK_KEY = 4242424245;

/**
 * Tries to acquire a transient advisory lock for the duration of one tick.
 * Returns true if this instance got it; false if another instance is already
 * running the same tick. The lock auto-releases at the end of the session
 * or via explicit unlock.
 */
async function runWithLock<T>(key: number, fn: () => Promise<T>): Promise<T | undefined> {
  const acquired = await db.execute<{ pg_try_advisory_lock: boolean }>(
    sql`SELECT pg_try_advisory_lock(${key})`,
  );
  const got = acquired[0]?.pg_try_advisory_lock === true;
  if (!got) {
    logger.debug({ key }, "cron.skip.lock_held_elsewhere");
    return undefined;
  }
  try {
    return await fn();
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${key})`);
  }
}

async function expireOrdersTick(): Promise<void> {
  const now = new Date();
  const expiredOrders = await OrderRepository.findExpired(now);

  let expired = 0;
  let skipped = 0;
  for (const order of expiredOrders) {
    const result = await OrderService.expireOrder(order.id);
    if (result) {
      expired++;
    } else {
      skipped++;
    }
  }

  if (expiredOrders.length > 0) {
    logger.info({ expired, skipped }, "cron.orders_expired");
  }
}

/**
 * T3-06: Nightly cleanup of expired and used auth_tokens.
 *
 * Deletes rows that are:
 *  - expired more than 7 days ago (expires_at < now() - 7 days), OR
 *  - consumed more than 7 days ago (used_at IS NOT NULL AND used_at < now() - 7 days)
 *
 * The 7-day grace period preserves an audit window before hard deletion.
 * Schedule: nightly at 03:00 UTC (cron: 0 3 * * *)
 * Lock: AUTH_TOKEN_CLEANUP_LOCK_KEY advisory lock (prevents dual-instance double-run).
 */
async function cleanupAuthTokensTick(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Delete tokens expired more than 7 days ago
  const expiredResult = await db
    .delete(authTokens)
    .where(lt(authTokens.expires_at, sevenDaysAgo))
    .returning({ id: authTokens.id });

  // Delete tokens consumed more than 7 days ago
  const usedResult = await db
    .delete(authTokens)
    .where(
      and(
        isNotNull(authTokens.used_at),
        lt(authTokens.used_at, sevenDaysAgo),
      ),
    )
    .returning({ id: authTokens.id });

  const totalDeleted = expiredResult.length + usedResult.length;
  logger.info({ count: totalDeleted, expired: expiredResult.length, used: usedResult.length }, "cron.auth_tokens_cleaned");
}

/**
 * Returns the number of milliseconds until the next occurrence of the given
 * hour:minute UTC time. Used to schedule the first nightly tick.
 */
function msUntilNextUtc(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0),
  );
  if (next.getTime() <= now.getTime()) {
    // Already passed today — schedule for tomorrow
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Schedules a function to run every 24 hours starting from the next occurrence
 * of `hour:minute` UTC. Uses advisory lock to prevent dual-instance double-runs.
 */
function scheduleNightly(
  lockKey: number,
  hour: number,
  minute: number,
  fn: () => Promise<void>,
): void {
  const schedule = () => {
    const delay = msUntilNextUtc(hour, minute);
    setTimeout(async () => {
      try {
        await runWithLock(lockKey, fn);
      } catch (err) {
        logger.error({ err }, "cron.nightly_tick_failed");
      }
      // Reschedule for next day
      schedule();
    }, delay);
  };
  schedule();
}

/**
 * Fix 2.3 — Reconciliation cron: detect approved MP payments whose webhook was missed.
 *
 * Runs every 5 minutes. For each PENDING MercadoPago order expiring within
 * the next 30 minutes, queries MP by external_reference. If MP reports
 * the payment as approved, the order is marked PAID immediately rather than
 * expiring and restoring stock erroneously.
 *
 * This handles the most common production failure: webhook not delivered due
 * to MP network error, secret rotation, or temporary backend downtime.
 */
async function reconcileOrdersTick(): Promise<void> {
  const candidates = await OrderRepository.findPendingNearExpiry();
  if (candidates.length === 0) return;

  let reconciled = 0;
  let skipped = 0;

  for (const order of candidates) {
    try {
      const payment = await MercadoPagoService.findByExternalReference(order.id);
      if (payment?.status === "approved") {
        await OrderService.markOrderPaid(order.id, String(payment.id));
        reconciled++;
        logger.info({ orderId: order.id, paymentId: payment.id }, "cron.reconcile.order_paid");
      } else {
        skipped++;
        logger.debug(
          { orderId: order.id, mpStatus: payment?.status ?? "not_found" },
          "cron.reconcile.order_not_approved",
        );
      }
    } catch (err) {
      logger.error({ err, orderId: order.id }, "cron.reconcile.order_error");
    }
  }

  logger.info({ candidates: candidates.length, reconciled, skipped }, "cron.reconcile.tick_done");
}

/**
 * Fix 2.8 — Nightly cleanup of old webhook_event rows.
 *
 * Deletes rows processed more than 90 days ago. Without this, the table
 * grows indefinitely (unlike auth_tokens which has its own cleanup job).
 * Schedule: nightly at 03:30 UTC to avoid colliding with auth_tokens cleanup (03:00).
 * Lock: WEBHOOK_EVENT_CLEANUP_LOCK_KEY advisory lock.
 */
async function cleanupWebhookEventsTick(): Promise<void> {
  const result = await db.execute<{ count: string }>(
    sql`DELETE FROM webhook_event
        WHERE processed_at < NOW() - INTERVAL '90 days'
        RETURNING id`,
  );
  logger.info({ count: result.length }, "cron.webhook_events_cleaned");
}

export function startCronJobs() {
  if (env.DISABLE_CRON === "true") {
    logger.info("cron.disabled_by_env");
    return;
  }

  setInterval(async () => {
    try {
      await runWithLock(ORDER_EXPIRY_LOCK_KEY, expireOrdersTick);
    } catch (err) {
      logger.error({ err }, "cron.tick_failed");
    }
  }, 60_000); // 1 minute

  // T3-06: Nightly auth_tokens cleanup — 03:00 UTC (cron: 0 3 * * *)
  scheduleNightly(AUTH_TOKEN_CLEANUP_LOCK_KEY, 3, 0, cleanupAuthTokensTick);

  // Fix 2.3: MercadoPago reconciliation — every 5 minutes
  setInterval(async () => {
    try {
      await runWithLock(MP_RECONCILE_LOCK_KEY, reconcileOrdersTick);
    } catch (err) {
      logger.error({ err }, "cron.reconcile_tick_failed");
    }
  }, 5 * 60_000); // 5 minutes

  // Fix 2.8: Nightly webhook_event TTL cleanup — 03:30 UTC (cron: 30 3 * * *)
  scheduleNightly(WEBHOOK_EVENT_CLEANUP_LOCK_KEY, 3, 30, cleanupWebhookEventsTick);
}
