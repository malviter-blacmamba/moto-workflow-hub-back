import { Router } from "express";
import { PromotionController } from "./promotion.controller";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.get("/", PromotionController.list);
router.get("/:id", PromotionController.getById);

router.post("/", adminMiddleware, PromotionController.create);
router.put("/:id", adminMiddleware, PromotionController.update);
router.delete("/:id", adminMiddleware, PromotionController.delete);

export default router;