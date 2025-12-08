import { Router } from "express";
import { authenticate, requireCustomer } from "../middleware/auth";
import {
  listProducts,
  getProduct,
  searchProducts,
} from "../controller/product";

const router = Router();

router.use(authenticate, requireCustomer);

router.get("/products", listProducts);
router.get("/products/:id", getProduct);

export default router;
