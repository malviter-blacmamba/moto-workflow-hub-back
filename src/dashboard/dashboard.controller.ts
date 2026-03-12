import type { Response } from "express";
import { getDashboardSummary } from "./dashboard.service";
import type { AuthRequest } from "../middleware/auth";

export async function dashboardSummaryController(req: AuthRequest, res: Response) {
  try {
    const dateFrom =
      typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined;
    const dateTo =
      typeof req.query.dateTo === "string" ? req.query.dateTo : undefined;

    let kanbanLimit: number | undefined;
    if (
      typeof req.query.kanbanLimit === "string" &&
      req.query.kanbanLimit.trim() !== ""
    ) {
      const n = Number(req.query.kanbanLimit);
      if (Number.isFinite(n)) kanbanLimit = n;
    }

    const data = await getDashboardSummary(
      {
        dateFrom,
        dateTo,
        kanbanLimit,
      },
      req.user?.role ?? "USER"
    );

    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Error al cargar dashboard" });
  }
}