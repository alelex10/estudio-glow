import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getCart,
  syncCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
} from "../controller/cart";

const router = Router();

router.use(authenticate);

router.get("/", getCart);
router.post("/sync", syncCart);
router.post("/items", addCartItem);
router.patch("/items/:productId", updateCartItemQuantity);
router.delete("/:productId", removeCartItem);

export default router;
