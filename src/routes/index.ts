import { Router } from "express";
import authRoutes from "../auth/auth.routes";
import clientRoutes from "../client/client.routes";
import motorcycleRoutes from "../motorcycle/motorcycle.routes";
import serviceRoutes from "../service/service.routes";
import promotionRoutes from "../promotion/promotion.routes";
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

export default router;
