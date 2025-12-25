// src/dashboard/dashboard.controller.ts
import type { Request, Response } from "express";
import { getDashboardSummary } from "./dashboard.service";

export async function dashboardSummaryController(req: Request, res: Response) {
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

  const data = await getDashboardSummary({ dateFrom, dateTo, kanbanLimit });
  res.json(data);
}
