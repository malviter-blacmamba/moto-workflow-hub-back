import { Router } from "express";
import authRoutes from "../auth/auth.routes";
import clientRoutes from "../client/client.routes";
import motorcycleRoutes from "../motorcycle/motorcycle.routes";
import serviceRoutes from "../service/service.routes";
import promotionRoutes from "../promotion/promotion.routes";
import promotionRuleRoutes from "../promotion-rules/promotion-rule.routes";
import workOrderRoutes from "../workorder/workorder.routes";
import reminderRoutes from "../reminder/reminder.routes";
import reportRoutes from "../report/report.routes";
import userRoutes from "../user/user.routes";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use("/auth", authRoutes);

router.get("/status", (req, res) => {
  res.json({ ok: true, message: "Backend funcionando ✔️" });
});

router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Acceso autorizado", user: (req as any).user });
});

router.use("/clients", authMiddleware, clientRoutes);
router.use("/motorcycles", motorcycleRoutes);
router.use("/services", serviceRoutes);
router.use("/promotions", promotionRoutes);
router.use("/promotion-rules", promotionRuleRoutes);
router.use("/work-orders", workOrderRoutes);
router.use("/reminders", reminderRoutes);
router.use("/reports", reportRoutes);
router.use("/users", userRoutes);

export default router;
