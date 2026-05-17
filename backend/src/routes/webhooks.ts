import express, { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { verifyMpWebhook, type WebhookRequest } from "../middleware/verify-mp-webhook";
import { WebhookEventService } from "../services/WebhookEventService";
import { OrderService } from "../services/OrderService";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
const router = Router();

// express.raw() must come BEFORE express.json() on this route so the HMAC
// middleware receives the unmodified byte sequence for signature verification.
router.post(
  "/mercadopago",
  express.raw({ type: "application/json" }),
  verifyMpWebhook,
  asyncHandler(async (req: WebhookRequest, res: Response) => {
    const { action, data, type } = req.parsedWebhookBody;

    if ((action === "payment.updated" || type === "payment") && data?.id) {
      const paymentId = String(data.id);
      const resolvedAction = action ?? type ?? "unknown";

      // Idempotency: skip if this (payment, action) pair was already processed.
      // Composite key allows the same payment_id to go through distinct lifecycle
      // transitions (e.g. approved → refunded) without being deduped.
      const { duplicate } = await WebhookEventService.recordOrSkip(paymentId, resolvedAction);
      if (duplicate) {
        return res.sendStatus(200);
      }

      const paymentSDK = new Payment(client);
      const payment = await paymentSDK.get({ id: data.id });
      const externalRef = payment.external_reference;

      if (!externalRef) {
        logger.warn({ paymentId, status: payment.status }, "webhook.missing_external_reference");
        return res.sendStatus(200);
      }

      switch (payment.status) {
        case "approved":
          await OrderService.markOrderPaid(externalRef, paymentId);
          break;

        case "rejected":
        case "cancelled":
          await OrderService.cancelOrder(externalRef);
          break;

        case "refunded":
        case "charged_back":
          // TODO: implement OrderService.markRefunded once refund flow is designed.
          // For now, log so the ops team can act manually.
          logger.warn(
            { orderId: externalRef, paymentId, status: payment.status },
            "webhook.refund_or_chargeback_requires_manual_action",
          );
          break;

        case "in_process":
        case "pending":
          logger.info(
            { orderId: externalRef, paymentId, status: payment.status },
            "webhook.payment_in_progress",
          );
          break;

        default:
          logger.warn(
            { orderId: externalRef, paymentId, status: payment.status },
            "webhook.unknown_payment_status",
          );
      }
    }

    res.sendStatus(200);
  })
);

export default router;
