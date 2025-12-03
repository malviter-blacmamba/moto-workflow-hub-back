import { Router } from "express";
import { PromotionController } from "./promotion.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", PromotionController.list);
router.get("/:id", PromotionController.getById);
router.post("/", PromotionController.create);
router.put("/:id", PromotionController.update);
router.delete("/:id", PromotionController.delete);

export default router;
