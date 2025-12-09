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

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", authenticate, requireAdmin, createCategory);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

export default router;
