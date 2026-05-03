import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { OrderService } from "../services/OrderService";
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'test_token' });
const router = Router();

// Endpoint for MercadoPago Webhooks
router.post("/mercadopago", asyncHandler(async (req: Request, res: Response) => {
  const { action, data, type } = req.body;

  if ((action === "payment.updated" || type === "payment") && data?.id) {
    const paymentSDK = new Payment(client);
    const payment = await paymentSDK.get({ id: data.id });

    if (payment.status === "approved" && payment.external_reference) {
      await OrderService.markOrderPaid(payment.external_reference);
    }
  }

  res.sendStatus(200);
}));

export default router;
