import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getCart, syncCart, removeCartItem } from "../controller/cart";

const router = Router();

router.use(authenticate);

router.get("/", getCart);
router.post("/sync", syncCart);
router.delete("/:productId", removeCartItem);

export default router;
