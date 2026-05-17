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
import { idempotency } from "../middleware/idempotency";

const router = Router();

router.use(authenticate);

const upload = validateImageFile(5);

router.post("/mercadopago", idempotency, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("El carrito está vacío");
  }

  const order = await OrderService.createOrder(userId, "MERCADO_PAGO", items);

  const preference = await MercadoPagoService.createPreference(
    order.id,
    `Pedido Estudio Glow #${order.id.slice(0, 8)}`,
    order.totalAmount
  );

  res.json({ orderId: order.id, preferenceUrl: preference.init_point });
}));

router.post("/transfer", idempotency, upload.single("receipt"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;

  if (!req.file) {
    throw new BadRequestError("La imagen del comprobante es requerida para transferencias");
  }

  const items = req.body.items ? JSON.parse(req.body.items) : [];
  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("El carrito está vacío");
  }

  const result = await ImageUploadService.uploadImage(req.file.buffer, "receipts");
  const order = await OrderService.createOrder(userId, "TRANSFER", items, result.secure_url);

  res.json({ orderId: order.id, status: "PENDING_VERIFICATION", receiptUrl: result.secure_url });
}));

export default router;
