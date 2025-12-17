import { Router } from "express";

import { listProductsPaginated } from "../controller/product";
import { searchProducts } from "../controller/product";

const router = Router();

router.get("/products/paginated", listProductsPaginated);
router.get("/search", searchProducts);

export default router;
