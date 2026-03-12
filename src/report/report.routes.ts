import { Router } from "express";
import { ReportController } from "./report.controller";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.use(adminMiddleware);

router.get("/dashboard", ReportController.dashboard);
router.get("/top-services", ReportController.topServices);

export default router;