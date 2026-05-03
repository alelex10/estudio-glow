import { Router } from "express";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/async-handler";
import { BadRequestError } from "../errors";
import { OrderService } from "../services/OrderService";
import { MercadoPagoService } from "../services/MercadoPagoService";
import { validateImageFile } from "../middleware/file-validation";
import { ImageUploadService } from "../services/imageUploadService";

const router = Router();

router.use(authenticate);

const upload = validateImageFile(5);

router.post("/mercadopago", asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const order = await OrderService.createOrder(userId, "MERCADO_PAGO");

  const preference = await MercadoPagoService.createPreference(
    order.id,
    `Pedido Estudio Glow #${order.id.slice(0, 8)}`,
    order.totalAmount
  );

  res.json({ orderId: order.id, preferenceUrl: preference.init_point });
}));

router.post("/transfer", upload.single("receipt"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;

  if (!req.file) {
    throw new BadRequestError("La imagen del comprobante es requerida para transferencias");
  }

  const result = await ImageUploadService.uploadImage(req.file.buffer, "receipts");
  const order = await OrderService.createOrder(userId, "TRANSFER", result.secure_url);

  res.json({ orderId: order.id, status: "PENDING_VERIFICATION", receiptUrl: result.secure_url });
}));

export default router;
