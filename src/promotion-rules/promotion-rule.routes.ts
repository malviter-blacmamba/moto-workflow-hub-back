import { Router } from "express";
import { PromotionRuleController } from "./promotion-rule.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", PromotionRuleController.list);
router.get("/:id", PromotionRuleController.getById);
router.post("/", PromotionRuleController.create);
router.put("/:id", PromotionRuleController.update);
router.delete("/:id", PromotionRuleController.delete);

export default router;
