import { Router, Response } from "express";
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
import dashboardRoutes from "../dashboard/dashboard.routes";
import notificationRoutes from "../notifications/notification.routes";
import accountRoutes from "../account/account.routes";
import searchRoutes from "../search/search.routes";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.use("/auth", authRoutes);

router.get("/status", (req, res) => {
  res.json({ ok: true, message: "Backend funcionando ✔️" });
});

router.get("/protected", authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ message: "Acceso autorizado", user: req.user });
});

router.use("/clients", authMiddleware, clientRoutes);
router.use("/motorcycles", authMiddleware, motorcycleRoutes);
router.use("/services", authMiddleware, serviceRoutes);
router.use("/promotions", authMiddleware, promotionRoutes);
router.use("/promotion-rules", authMiddleware, promotionRuleRoutes);
router.use("/work-orders", authMiddleware, workOrderRoutes);
router.use("/reminders", authMiddleware, reminderRoutes);
router.use("/reports", authMiddleware, reportRoutes);
router.use("/users", authMiddleware, userRoutes);
router.use("/dashboard", authMiddleware, dashboardRoutes);
router.use("/notifications", authMiddleware, notificationRoutes);
router.use("/account", authMiddleware, accountRoutes);
router.use("/search", authMiddleware, searchRoutes);

export default router;