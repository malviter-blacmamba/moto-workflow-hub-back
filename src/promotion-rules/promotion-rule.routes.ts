import { Router } from "express";
import { PromotionRuleController } from "./promotion-rule.controller";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.get("/", PromotionRuleController.list);
router.get("/:id", PromotionRuleController.getById);

router.post("/", adminMiddleware, PromotionRuleController.create);
router.put("/:id", adminMiddleware, PromotionRuleController.update);
router.delete("/:id", adminMiddleware, PromotionRuleController.delete);

export default router;