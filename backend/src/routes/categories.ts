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

// Solo admins
router.use(authenticate, requireAdmin);

router.get("/categories", listCategories);
router.get("/categories/:id", getCategory);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

export default router;
