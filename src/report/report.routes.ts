import { Router } from "express";
import { ReportController } from "./report.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", ReportController.dashboard);
router.get("/top-services", ReportController.topServices);

export default router;
