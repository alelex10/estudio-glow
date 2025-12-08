import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controller/category";

const router = Router();

// Solo admins en post, put y delete

router.get("/categories", listCategories);
router.get("/categories/:id", getCategory);
router.post("/categories", authenticate, requireAdmin, createCategory);
router.put("/categories/:id", authenticate, requireAdmin, updateCategory);
router.delete("/categories/:id", authenticate, requireAdmin, deleteCategory);

export default router;
