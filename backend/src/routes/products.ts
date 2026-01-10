import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

import {
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  listProductsPaginated,
  filterProducts,
  getNewProducts,
} from "../controller/product";

const router = Router();

router.get("/search", searchProducts);
router.get("/paginated", listProductsPaginated);
router.get("/filter", filterProducts);
router.get("/news", getNewProducts);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);
router.get("/:id", getProduct);

export default router;
