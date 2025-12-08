import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  listProductsPaginated,
} from "../controller/product";

const router = Router();

router.get("/", listProducts);
router.get("/search", searchProducts);
router.get("/paginated", listProductsPaginated);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);
router.get("/:id", getProduct);

export default router;
