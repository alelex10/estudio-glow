import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { OrderService } from "../services/OrderService";
import { MercadoPagoService } from "../services/MercadoPagoService";
import { validateImageFile } from "../middleware/file-validation";
import { ImageUploadService } from "../services/imageUploadService"; // Assuming it exists based on exploration

const router = Router();

router.use(authenticate);

const upload = validateImageFile(5);

router.post("/mercadopago", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const order = await OrderService.createOrder(userId, "MERCADO_PAGO");

    // Create preference
    const preference = await MercadoPagoService.createPreference(
      order.id,
      `Pedido Estudio Glow #${order.id.slice(0, 8)}`,
      order.totalAmount
    );

    res.json({ orderId: order.id, preferenceUrl: preference.init_point });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create order" });
  }
});

router.post("/transfer", upload.single("receipt"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      res.status(400).json({ error: "Receipt image is required for transfers" });
      return;
    }

    // Upload receipt image
    const result = await ImageUploadService.uploadImage(req.file.buffer, "receipts");
    const receiptUrl = result.secure_url;

    const order = await OrderService.createOrder(userId, "TRANSFER", receiptUrl);

    res.json({ orderId: order.id, status: "PENDING_VERIFICATION", receiptUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create order" });
  }
});

export default router;
