import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { logger } from "../lib/logger";

const router = Router();

/**
 * Liveness probe — process is up and Express is responsive.
 */
router.get("/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Readiness probe — process is up AND can reach the database.
 * Returns 503 if the DB roundtrip fails.
 */
router.get("/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed: database unreachable");
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

export default router;
