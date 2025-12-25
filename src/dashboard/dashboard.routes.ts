// src/dashboard/dashboard.routes.ts
import { Router } from "express";
import { dashboardSummaryController } from "./dashboard.controller";

const router = Router();

router.get("/summary", dashboardSummaryController);

export default router;
