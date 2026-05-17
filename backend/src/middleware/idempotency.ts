import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { BadRequestError } from "../errors";
import { logger } from "../lib/logger";

/**
 * Postgres-backed idempotency middleware.
 *
 * Stores the response payload keyed by (userId, idempotencyKey) for `TTL_MS`,
 * so a retried POST (e.g. double-click on Pay) returns the cached response
 * without re-running the side effect.
 *
 * Safe across restarts and multi-instance deployments — no in-memory state.
 *
 * Inflight lifecycle:
 *  - INSERT ... ON CONFLICT DO NOTHING → if the row was freshly inserted,
 *    this instance owns the request (inflight=true, TTL=INFLIGHT_TTL_MS).
 *  - If the row already exists and inflight=true → 409 Retry-After (concurrent retry).
 *  - If the row already exists and inflight=false → replay cached response.
 *  - On res.on('finish') → persist body+status and clear inflight flag.
 *  - On res.on('close') without finish → release inflight so the client can retry.
 */

/** Cache TTL: how long a completed response is replayed. */
const TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Inflight TTL: maximum time a request can hold the lock before being auto-released. */
const INFLIGHT_TTL_MS = 30 * 1000; // 30 seconds

async function persistResponseAndRelease(
  userId: string,
  key: string,
  statusCode: number,
  body: unknown,
): Promise<void> {
  try {
    // Only cache non-5xx responses; on 5xx let the client retry with the same key.
    if (statusCode >= 500) {
      await db.execute(
        sql`DELETE FROM idempotency_key WHERE user_id = ${userId} AND key = ${key}`,
      );
      return;
    }

    await db.execute(
      sql`UPDATE idempotency_key
          SET response_json = ${JSON.stringify(body)}::jsonb,
              status_code   = ${statusCode},
              inflight      = FALSE,
              expires_at    = NOW() + INTERVAL '10 minutes'
          WHERE user_id = ${userId} AND key = ${key}`,
    );
  } catch (err) {
    logger.error({ err, userId, key }, "idempotency.persist_failed");
  }
}

async function releaseInflightIfNotPersisted(
  userId: string,
  key: string,
): Promise<void> {
  try {
    // Only delete if still inflight (i.e. finish did not run first).
    await db.execute(
      sql`DELETE FROM idempotency_key
          WHERE user_id = ${userId} AND key = ${key} AND inflight = TRUE`,
    );
  } catch (err) {
    logger.error({ err, userId, key }, "idempotency.release_inflight_failed");
  }
}

/**
 * Per-user idempotency by `Idempotency-Key` header.
 *
 * - Missing header → 400 (required on financial mutations).
 * - First request → executes handler, captures response, caches it.
 * - Retried request with same key and completed response → returns cached response.
 * - Concurrent retry of inflight key → 409 with Retry-After.
 */
export async function idempotency(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key = req.header("idempotency-key");
  if (!key) {
    return next(new BadRequestError("Idempotency-Key header is required"));
  }

  const userId = (req as Request & { user?: { id: string } }).user?.id;
  if (!userId) {
    return next(new BadRequestError("Idempotency-Key requires authenticated request"));
  }

  const now = new Date();
  const inflightExpiresAt = new Date(now.getTime() + INFLIGHT_TTL_MS);

  try {
    // Try to insert a new inflight row. ON CONFLICT DO NOTHING means if the row
    // already exists (same userId+key), nothing is inserted and we get 0 rows back.
    const inserted = await db.execute<{ user_id: string }>(
      sql`INSERT INTO idempotency_key (user_id, key, inflight, expires_at)
          VALUES (${userId}, ${key}, TRUE, ${inflightExpiresAt})
          ON CONFLICT (user_id, key) DO NOTHING
          RETURNING user_id`,
    );

    if (inserted.length === 0) {
      // Row already exists — fetch current state.
      const existing = await db.execute<{
        inflight: boolean;
        expires_at: Date;
        response_json: unknown;
        status_code: number | null;
      }>(
        sql`SELECT inflight, expires_at, response_json, status_code
            FROM idempotency_key
            WHERE user_id = ${userId} AND key = ${key}`,
      );

      const row = existing[0];

      if (!row) {
        // Row vanished between the insert attempt and this select (e.g. TTL cleanup).
        // Treat as a fresh request: fall through to next().
      } else if (row.inflight && new Date(row.expires_at).getTime() > Date.now()) {
        // Still in-flight and not yet expired — ask client to back off.
        res.setHeader("Retry-After", "5");
        res.status(409).json({ error: { message: "Duplicate request in flight — retry in a few seconds" } });
        return;
      } else if (!row.inflight && row.status_code != null) {
        // Completed — replay the cached response.
        res.status(row.status_code).json(row.response_json);
        return;
      }
      // inflight=true but expired, or inflight=false with no response: fall through.
    }
  } catch (err) {
    logger.error({ err, userId, key }, "idempotency.db_check_failed");
    // On DB error, degrade gracefully and process the request without idempotency.
    return next();
  }

  // This instance owns the request. Capture the body for persistence on finish.
  let capturedBody: unknown = null;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    capturedBody = body;
    return originalJson(body);
  };

  // Fix 2.5: use response lifecycle events instead of monkey-patching res.json only.
  // 'finish' fires when the response is fully sent; 'close' fires if the connection
  // drops before finish (e.g. client disconnected mid-flight).
  res.on("finish", () => {
    persistResponseAndRelease(userId, key, res.statusCode, capturedBody).catch(
      (err) => logger.error({ err }, "idempotency.finish_persist_error"),
    );
  });

  res.on("close", () => {
    // Only runs if 'finish' did not run first. Releases the inflight lock so the
    // client can retry with the same key.
    if (!res.writableEnded) {
      releaseInflightIfNotPersisted(userId, key).catch(
        (err) => logger.error({ err }, "idempotency.close_release_error"),
      );
    }
  });

  next();
}
