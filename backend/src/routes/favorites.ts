import { Router } from "express";
import { addFavorite, removeFavorite, listFavorites, getFavoriteIds } from "../controller/favorite";
import { authenticate } from "../middleware/auth";

const router = Router();

// All favorites routes require authentication
router.use(authenticate);

router.get("/", listFavorites);
router.get("/ids", getFavoriteIds);
router.post("/:productId", addFavorite);
router.delete("/:productId", removeFavorite);

export default router;
