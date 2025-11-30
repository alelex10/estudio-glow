import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from "../controller/product";

const router = Router();

// Solo admins
router.use(authenticate, requireAdmin);

router.get("/products", listProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/search", searchProducts);

export default router;
