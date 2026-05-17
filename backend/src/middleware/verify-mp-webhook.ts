import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AuthenticationError, BadRequestError } from "../errors";

export interface ParsedWebhookBody {
  action?: string;
  type?: string;
  data?: { id: string };
}

/** Express Request augmented with the parsed webhook payload. */
export interface WebhookRequest extends Request {
  parsedWebhookBody: ParsedWebhookBody;
}

/**
 * Middleware that validates MercadoPago webhook signatures via HMAC-SHA256.
 *
 * Expected header format: x-signature: ts=<unix_seconds>,v1=<hex_digest>
 * Signed manifest:        id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * - Rejects with 401 (AuthenticationError) on: missing header, clock skew > 300 s,
 *   buffer-length mismatch, or digest mismatch.
 * - Rejects with 400 (BadRequestError) on: body not parseable as JSON.
 * - Fails closed with 401 when MP_WEBHOOK_SECRET is absent at runtime.
 *
 * On success, attaches `req.parsedWebhookBody` so the route handler can use the
 * parsed object without re-parsing the Buffer.
 */
export function verifyMpWebhook(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // --- Fail-closed: secret must be present ---
  if (!env.MP_WEBHOOK_SECRET) {
    console.warn("[verifyMpWebhook] MP_WEBHOOK_SECRET is not set — rejecting request");
    return next(new AuthenticationError("Webhook secret not configured"));
  }

  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;

  // --- Required headers ---
  if (!xSignature || !xRequestId) {
    console.warn("[verifyMpWebhook] Missing required headers", {
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId,
      timestamp: new Date().toISOString(),
    });
    return next(new AuthenticationError("Missing x-signature or x-request-id header"));
  }

  // --- Parse x-signature: "ts=<ts>,v1=<hex>" ---
  const signatureParts = xSignature.split(",");
  const tsPart = signatureParts.find((p) => p.startsWith("ts="));
  const v1Part = signatureParts.find((p) => p.startsWith("v1="));

  if (!tsPart || !v1Part) {
    return next(new AuthenticationError("Malformed x-signature header — expected ts=...,v1=..."));
  }

  const ts = tsPart.slice(3);   // "ts=".length === 3
  const v1 = v1Part.slice(3);   // "v1=".length === 3

  if (!ts || !v1) {
    return next(new AuthenticationError("Malformed x-signature header — empty ts or v1 value"));
  }

  // --- Clock-skew guard: ±300 seconds ---
  const nowSeconds = Date.now() / 1000;
  const tsNumber = Number(ts);

  if (!Number.isFinite(tsNumber) || Math.abs(nowSeconds - tsNumber) > 300) {
    console.warn("[verifyMpWebhook] Clock skew exceeded or invalid ts", {
      ts,
      nowSeconds,
      delta: Math.abs(nowSeconds - tsNumber),
      timestamp: new Date().toISOString(),
    });
    return next(new AuthenticationError("Webhook timestamp outside allowed window"));
  }

  // --- Parse body Buffer once ---
  let parsedBody: ParsedWebhookBody;
  try {
    const rawBody = req.body as Buffer;
    parsedBody = JSON.parse(rawBody.toString("utf-8")) as ParsedWebhookBody;
  } catch {
    return next(new BadRequestError("Could not parse request body as JSON"));
  }

  const dataId = parsedBody.data?.id ?? "";

  // --- Build manifest and compute HMAC ---
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac("sha256", env.MP_WEBHOOK_SECRET);
  hmac.update(manifest);
  const computedHex = hmac.digest("hex");

  // --- Constant-time comparison (length check FIRST — timingSafeEqual throws on mismatch) ---
  const computedBuf = Buffer.from(computedHex, "hex");
  let receivedBuf: Buffer;
  try {
    receivedBuf = Buffer.from(v1, "hex");
  } catch {
    return next(new AuthenticationError("Invalid v1 value in x-signature header"));
  }

  if (computedBuf.byteLength !== receivedBuf.byteLength) {
    console.warn("[verifyMpWebhook] Buffer length mismatch — likely wrong secret or corrupted v1", {
      computedLength: computedBuf.byteLength,
      receivedLength: receivedBuf.byteLength,
      dataId: dataId || undefined,
      timestamp: new Date().toISOString(),
    });
    return next(new AuthenticationError("Invalid MP webhook signature"));
  }

  if (!crypto.timingSafeEqual(computedBuf, receivedBuf)) {
    console.warn("[verifyMpWebhook] Digest mismatch", {
      dataId: dataId || undefined,
      timestamp: new Date().toISOString(),
    });
    return next(new AuthenticationError("Invalid MP webhook signature"));
  }

  // --- Signature valid: attach parsed body and proceed ---
  (req as WebhookRequest).parsedWebhookBody = parsedBody;
  next();
}
